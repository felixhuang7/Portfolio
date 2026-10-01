"""Build the static blog from committed Markdown; no browser CDN is required."""
from pathlib import Path
from copy import deepcopy
from html import escape
import argparse
import hashlib
import json
import math
import re
import xml.etree.ElementTree as ET

from bs4 import BeautifulSoup
import markdown
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / 'content' / 'posts'
TEMPLATES = ROOT / 'tools' / 'templates'
POSTS = [
    dict(slug='harness-architecture', file='01_AI应用Harness完整架构.md',
         title='AI 应用 Harness 完整架构：面试系统设计版', tags=['Harness', 'Agent'],
         title_lines=('AI 应用 Harness 完整架构：', '面试系统设计版'),
         cover='01_harness_layers_v4',
         description='从交互入口到网关、上下文、工具与模型，系统梳理 Agent 执行闭环、记忆、权限、恢复和评测。'),
    dict(slug='agent-interview', file='02_AI应用与Agent开发面试题及优质回答.md',
         title='AI 应用与 Agent 开发面试题及优质回答', tags=['Agent', '面试'],
         title_lines=('AI 应用与 Agent 开发', '面试题及优质回答'),
         cover='02_agent_loop_final',
         description='64 道面试题，覆盖 Harness、MCP、Skill、RAG、多 Agent、性能、安全与项目表达，每题包含回答、追问和失分点。'),
]
TAGS = {'Harness': 'harness', 'Agent': 'agent', '面试': 'interview'}
DATE = '2026-10-01'


def soup(text):
    return BeautifulSoup(text, 'html.parser')


def fragment(text):
    return soup(text)


def set_html(node, text):
    node.clear()
    for child in list(fragment(text).contents):
        node.append(child)


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('\n'.join(line.rstrip() for line in text.splitlines()) + '\n', encoding='utf-8', newline='\n')


def optimize_image(source, target, width, quality=84):
    with Image.open(source) as image:
        image = image.convert('RGB')
        if image.width > width:
            image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS).save(target, 'WEBP', quality=quality, method=6)
        else:
            image.save(target, 'WEBP', quality=quality, method=6)


def common(page):
    # Keep the theme and its core interactions; drop duplicate animation injectors,
    # CDN plugins, counters and the overlay that waited for window.load.
    raw = str(page).replace('https://github.com/zhishimianbao', 'https://github.com/felixhuang7')
    raw = raw.replace('https://github.com/mianbaozhishi', 'https://github.com/felixhuang7')
    raw = re.sub(r'https?://(?:zhishimianbao|mianbaozhishi)\.github\.io', SITE, raw)
    raw = raw.replace('芝士面包', 'felixhuang7')
    page = soup(raw)
    for link in list(page.select('link')):
        href = link.get('href', '')
        if href.startswith(('http:', 'https:', '//')) and link.get('rel') != ['canonical']:
            link.decompose()
        elif link.get('rel') == ['stylesheet']:
            link.attrs.pop('media', None)
            link.attrs.pop('onload', None)
    for script in list(page.select('script')):
        if script.get('src'):
            if script['src'] not in ['/js/utils.js', '/js/main.js', '/js/tw_cn.js', '/js/search/local-search.js']:
                script.decompose()
            else:
                script['defer'] = ''
        elif script.get('id') == 'config-diff':
            pass
        elif 'const GLOBAL_CONFIG =' in script.get_text():
            text = script.get_text().replace('"preload":true', '"preload":false')
            text = text.replace('islazyload: true', 'islazyload: false').replace("lightbox: 'fancybox'", "lightbox: undefined")
            text = re.sub(r'  Snackbar: .*?,\n', '  Snackbar: undefined,\n', text)
            text = re.sub(r"  source: \{.*?\n  \},", '  source: {},', text, flags=re.S)
            script.string = text
        elif 'win.saveToLocal' not in script.get_text():
            script.decompose()
    for node in page.select('#loading-box, .post_share'):
        node.decompose()
    for image in page.select('img'):
        src = image.attrs.pop('data-lazy-src', image.get('src', ''))
        if 'zj1O58' in src or image.find_parent(class_='avatar-img'):
            src = '/img/avatar.webp'
            image['alt'] = 'felixhuang7 的 GitHub 头像'
        elif src.startswith(('https:', 'http:', '//')) or src == '/assets/head.jpg':
            src = '/img/favicon.png'
        image['src'] = src
        image.attrs.pop('onerror', None)
        image['decoding'] = 'async'
        image['loading'] = 'lazy'
        local = ROOT / src.lstrip('/')
        if local.is_file():
            with Image.open(local) as im:
                image['width'], image['height'] = im.size
    for image in page.select('.card-info .avatar-img img'):
        image['loading'] = 'eager'
    for meta in page.select('meta[property="og:image"], meta[name="twitter:image"]'):
        meta['content'] = SITE + '/img/avatar.webp'
    viewport = page.select_one('meta[name="viewport"]')
    if viewport:
        viewport['content'] = 'width=device-width, initial-scale=1.0'
    for element in page.select('#page-header[style]'):
        element.attrs.pop('style', None)
    subtitle = page.select_one('#subtitle')
    if subtitle:
        subtitle.string = '欢迎来到 🍞芝士🍞 的个人博客 🧐🧐🧐'
    author_description = page.select_one('.author-info__description')
    if author_description:
        author_description.decompose()
    button = page.select_one('#card-info-btn')
    if button:
        button['href'] = 'https://github.com/felixhuang7'
        icon = button.select_one('i')
        if icon:
            icon.decompose()
        button.select_one('span').string = '🚀 去康康我的 GitHub'
    for link in page.select('a[target="_blank"]'):
        link['rel'] = ['noopener', 'noreferrer']
    for node in page.select('.length-num'):
        href = node.find_parent('a')['href']
        node.string = str(3 if '/tags/' in href else 1 if '/categories/' in href else 2)
    for node in list(page.select('.webinfo-item')):
        label = node.select_one('.item-name').get_text()
        count = node.select_one('.item-count')
        if '访客' in label or '访问量' in label:
            node.decompose()
        elif '文章' in label:
            count.string = '2'
        elif '字数' in label:
            count.string = str(sum(p.get('words', 0) for p in POSTS))
        elif '更新' in label:
            count.string = DATE
            count.attrs.pop('data-lastpushdate', None)
            count.attrs.pop('id', None)
    copyright = page.select_one('#footer-wrap .copyright')
    if copyright:
        copyright.string = '©2022 – 2026 By felixhuang7'
    if not page.select_one('link[href="/vendor/fontawesome/css/all.min.css"]'):
        page.head.append(fragment('<link rel="stylesheet" href="/vendor/fontawesome/css/all.min.css">').link)
    for src in ['/js/blog.js', '/js/effects.js']:
        if not page.select_one(f'script[src="{src}"]'):
            page.body.append(fragment(f'<script defer src="{src}"></script>').script)
    return page


def metadata(page, path, title, description='', post=False, home=False):
    page.title.string = (title + ' | 🍞芝士 Blog🍞') if title else '🍞芝士 Blog🍞'
    for selector, value in [('meta[property="og:url"]', SITE + path),
                            ('meta[property="og:title"]', title or '🍞芝士 Blog🍞')]:
        node = page.select_one(selector)
        if node:
            node['content'] = value
    canonical = page.select_one('link[rel="canonical"]')
    if canonical:
        canonical['href'] = SITE + path
    desc = page.select_one('meta[name="description"]')
    if desc is None:
        desc = page.new_tag('meta', attrs={'name': 'description'})
        page.head.append(desc)
    desc['content'] = description or 'felixhuang7 的个人博客，记录生活、学习与点滴。'
    if post:
        for prop in ['article:published_time', 'article:modified_time']:
            node = page.select_one(f'meta[property="{prop}"]')
            if node is None:
                node = page.new_tag('meta', attrs={'property': prop})
                page.head.append(node)
            node['content'] = DATE + 'T00:00:00+08:00'
    cfg = page.select_one('#config-diff')
    if cfg:
        cfg.string = 'var GLOBAL_CONFIG_SITE = ' + json.dumps(dict(title=title or '🍞芝士 Blog🍞', isPost=post, isHome=home,
                          isHighlightShrink=False, isToc=post, postUpdate=DATE + ' 00:00:00'), ensure_ascii=False)
    if not post and title and page.select_one('#site-title'):
        page.select_one('#site-title').string = title
    return page


def output(page, path):
    # Updated local styles and scripts must not reuse an older cached asset.
    for node, attr in [(node, 'href') for node in page.select('link[rel="stylesheet"][href]')] + [(node, 'src') for node in page.select('script[src]')]:
        url = node[attr].split('?', 1)[0]
        if url.startswith(('/css/', '/js/')):
            asset = ROOT / url.lstrip('/')
            version = hashlib.sha256(asset.read_text(encoding='utf-8').encode('utf-8')).hexdigest()[:12]
            node[attr] = f'{url}?v={version}'
    # root-relative paths support both a dedicated blog and /blog beside Portfolio.
    if BASE != '/':
        for node in page.select('[href], [src]'):
            for attr in ['href', 'src']:
                value = node.get(attr, '')
                if value.startswith('/') and not value.startswith('//'):
                    node[attr] = BASE.rstrip('/') + value
        for script in page.select('script:not([src])'):
            text = (script.string or '').replace("root: '/'", f"root: '{BASE}'")
            text = text.replace('"path":"/search.xml"', f'"path":"{BASE}search.xml"')
            script.string = text
    write(OUT / path, str(page))


def list_items(posts):
    result = '<div class="article-sort-item year">2026</div>'
    for p in posts:
        result += f'''<div class="article-sort-item"><a class="article-sort-item-img" href="{p['url']}" title="{p['title']}">
          <img src="/img/posts/{p['cover']}-thumb.webp" alt="{p['title']}" width="560" height="350" loading="lazy" decoding="async"></a>
          <div class="article-sort-item-info"><div class="article-sort-item-time"><time datetime="{DATE}T00:00:00+08:00">{DATE}</time></div>
          <a class="article-sort-item-title" href="{p['url']}">{p['title']}</a></div></div>'''
    return result


def main():
    global SITE, BASE, OUT
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', default='/')
    parser.add_argument('--site', default='https://felixhuang7.dpdns.org')
    parser.add_argument('--out', default=str(ROOT))
    args = parser.parse_args()
    BASE, SITE, OUT = args.base, args.site.rstrip('/'), Path(args.out)
    assert BASE.startswith('/') and BASE.endswith('/')
    article_assets = ROOT / 'img' / 'posts'
    article_assets.mkdir(parents=True, exist_ok=True)
    diagrams = ROOT / 'content' / 'diagrams'
    diagrams.mkdir(parents=True, exist_ok=True)
    TEMPLATES.mkdir(parents=True, exist_ok=True)
    for source in (CONTENT / 'images').glob('*.png'):
        optimize_image(source, article_assets / (source.stem + '.webp'), 1800, 88)
    for p in POSTS:
        p['url'] = f"/2026/10/01/{p['slug']}/"
        source = (CONTENT / p['file']).read_text(encoding='utf-8')
        p['source'] = source
        p['words'] = len(re.findall(r'[\u4e00-\u9fff]|[A-Za-z0-9_]+', source))
        p['minutes'] = math.ceil(p['words'] / 400)
        with Image.open(article_assets / (p['cover'] + '.webp')) as im:
            from PIL import ImageOps
            ImageOps.fit(im, (560, 350)).save(article_assets / (p['cover'] + '-thumb.webp'), 'WEBP', quality=84, method=6)

    if not (TEMPLATES / 'home.html').exists():
        originals = {'home': ROOT / 'index.html', 'page': ROOT / 'about/index.html',
                     'post': ROOT / '2022/12/21/测试用/index.html'}
        for key, path in originals.items():
            template = common(soup(path.read_text(encoding='utf-8')))
            if key == 'home':
                template.select_one('#recent-posts').clear()
            elif key == 'post':
                template.select_one('#post').clear()
                template.select_one('#post-info').clear()
                template.select_one('#card-toc .toc-content').clear()
                metadata(template, '/', '文章', post=True)
                for m in template.select('meta[property^="article:"]'):
                    m.decompose()
            write(TEMPLATES / (key + '.html'), str(template))

    home = common(soup((TEMPLATES / 'home.html').read_text(encoding='utf-8')))
    cards = ''
    for i, p in enumerate(POSTS):
        title = ''.join(f'<span class="title-line">{escape(line)}</span>' for line in p['title_lines'])
        cards += f'''<div class="recent-post-item"><div class="post_cover {'left' if i == 0 else 'right'}"><a href="{p['url']}">
        <img class="post_bg" src="/img/posts/{p['cover']}-thumb.webp" alt="{p['title']}" width="560" height="350" loading="lazy" decoding="async"></a></div>
        <div class="recent-post-info"><a class="article-title" href="{p['url']}" aria-label="{p['title']}">{title}</a>
        <div class="article-meta-wrap"><time datetime="{DATE}T00:00:00+08:00">{DATE}</time> · AI 与 Agent · {p['minutes']} 分钟</div>
        <div class="content">{p['description']}</div></div></div>'''
    set_html(home.select_one('#recent-posts'), cards)
    output(metadata(home, '/', '', home=True), 'index.html')

    page_template = common(soup((TEMPLATES / 'page.html').read_text(encoding='utf-8')))
    for route, title in [('comments', '留言板'), ('link', '友链'), ('Gallery', '照片'), ('music', '音乐'), ('movies', '电影')]:
        page = deepcopy(page_template)
        content_template = TEMPLATES / (route + '-content.html')
        if content_template.exists():
            content = content_template.read_text(encoding='utf-8')
        else:
            icons = {'Gallery': 'images', 'music': 'music', 'movies': 'film'}
            content = f'<div class="collection-empty"><i class="fas fa-{icons[route]}" aria-hidden="true"></i><h2>{title}</h2><p>还没有分享{title}，以后慢慢补上。</p><a href="/">先去看看博客文章 →</a></div>'
        set_html(page.select_one('#page'), '<div id="article-container">' + content + '</div>')
        output(metadata(page, '/' + route + '/', title), route + '/index.html')
    indexes = [('archives/index.html', '时间轴', POSTS), ('archives/2026/index.html', '2026 年', POSTS),
               ('archives/2026/10/index.html', '2026 年 10 月', POSTS),
               ('categories/ai-agent/index.html', '分类 - AI 与 Agent', POSTS)]
    for label, slug in TAGS.items():
        indexes.append((f'tags/{slug}/index.html', '标签 - ' + label, [p for p in POSTS if label in p['tags']]))
    for path, title, entries in indexes:
        page = deepcopy(page_template)
        node = page.select_one('#page')
        node['id'] = 'archive'
        set_html(node, f'<div class="article-sort-title">{title} · {len(entries)} 篇</div><div class="article-sort">{list_items(entries)}</div>')
        output(metadata(page, '/' + path.removesuffix('index.html'), title), path)

    tag_page = deepcopy(page_template)
    set_html(tag_page.select_one('#page'), '<div class="tag-cloud-list is-center">' + ''.join(
        f'<a href="/tags/{slug}/" style="font-size:1.2em">{label}</a>' for label, slug in TAGS.items()) + '</div>')
    output(metadata(tag_page, '/tags/', '标签'), 'tags/index.html')
    category_page = deepcopy(page_template)
    set_html(category_page.select_one('#page'), '<div class="category-lists"><ul class="category-list"><li class="category-list-item"><a class="category-list-link" href="/categories/ai-agent/">AI 与 Agent</a><span class="category-list-count">2</span></li></ul></div>')
    output(metadata(category_page, '/categories/', '分类'), 'categories/index.html')
    about = deepcopy(page_template)
    set_html(about.select_one('#page'), '<div id="article-container"><h2>关于我</h2><p>我是 felixhuang7，欢迎来到我的个人博客。这里记录生活、学习和感兴趣的事。</p><p><a href="https://github.com/felixhuang7" target="_blank" rel="noopener noreferrer">GitHub · felixhuang7</a></p></div>')
    output(metadata(about, '/about/', '关于'), 'about/index.html')

    for p in POSTS:
        page = common(soup((TEMPLATES / 'post.html').read_text(encoding='utf-8')))
        source = p['source']
        # The page header already contains the original document title.
        source = re.sub(r'^# [^\n]+\n', '', source, count=1)
        rendered = soup(markdown.markdown(source, extensions=['tables', 'fenced_code', 'sane_lists']))
        for i, code in enumerate(rendered.select('pre > code.language-mermaid'), 1):
            name = f"{p['slug']}-{i}"
            write(diagrams / (name + '.mmd'), code.get_text())
            svg = ROOT / 'img' / 'diagrams' / (name + '.svg')
            if svg.exists():
                details = fragment(f'<div class="diagram"><a href="/img/diagrams/{name}.svg"><img src="/img/diagrams/{name}.svg" alt="{p["title"]}：流程图 {i}" loading="lazy" decoding="async"></a></div><details><summary>查看 Mermaid 源码</summary></details>')
                details.details.append(deepcopy(code.parent))
                source = re.sub(r'```mermaid\n' + re.escape(code.get_text().rstrip('\n')) + r'\n```', lambda _: str(details), source, count=1)
        rendered = soup(markdown.markdown(source, extensions=['tables', 'fenced_code', 'sane_lists']))
        for image in rendered.select('img'):
            if image.get('src', '').startswith('images/'):
                image['src'] = '/img/posts/' + Path(image['src']).stem + '.webp'
            image['loading'], image['decoding'] = 'lazy', 'async'
            local = ROOT / image['src'].lstrip('/')
            if local.exists() and local.suffix != '.svg':
                with Image.open(local) as im:
                    image['width'], image['height'] = im.size
        toc = '<ol class="toc">'
        for i, heading in enumerate(rendered.select('h1,h2,h3,h4,h5,h6'), 1):
            heading['id'] = f'section-{i}'
            toc += f'<li class="toc-item toc-level-{heading.name[1:]}"><a class="toc-link" href="#section-{i}"><span class="toc-text">{escape(heading.get_text())}</span></a></li>'
        toc += '</ol>'
        set_html(page.select_one('#card-toc .toc-content'), toc)
        page.select_one('#card-toc .toc-content')['class'] = ['toc-content', 'is-expand']
        page.select_one('#card-toc .item-headline').append(fragment('<button type="button" id="toc-close" class="toc-control" aria-label="收起目录" title="收起目录" aria-controls="card-toc"><i class="fas fa-angle-left" aria-hidden="true"></i> 收起</button>').button)
        page.body.append(fragment('<button type="button" id="toc-toggle" class="toc-control" aria-controls="card-toc" aria-expanded="true"><i class="fas fa-list-ul" aria-hidden="true"></i> 展开目录</button>').button)
        set_html(page.select_one('#post-info'), f'<h1 class="post-title">{p["title"]}</h1><div id="post-meta"><time datetime="{DATE}T00:00:00+08:00">{DATE}</time> · <a href="/categories/ai-agent/">AI 与 Agent</a> · {p["words"]:,} 字 · {p["minutes"]} 分钟</div>')
        downloads = f'<p class="article-download"><a href="/content/posts/{p["file"]}" download>下载 Markdown 原文</a></p>'
        links = ' · '.join(f'<a class="post-meta__tags" href="/tags/{TAGS[t]}/">{t}</a>' for t in p['tags'])
        other = next(x for x in POSTS if x is not p)
        set_html(page.select_one('#post'), f'<article class="post-content" id="article-container">{rendered}</article>{downloads}<div class="tag_share">{links}</div><nav class="related-article"><a href="{other["url"]}">继续阅读：{other["title"]} →</a></nav>')
        output(metadata(page, p['url'], p['title'], p['description'], post=True), p['url'].lstrip('/') + 'index.html')

    root = ET.Element('search')
    for p in POSTS:
        entry = ET.SubElement(root, 'entry')
        ET.SubElement(entry, 'title').text = p['title']
        ET.SubElement(entry, 'url').text = BASE.rstrip('/') + p['url']
        ET.SubElement(entry, 'content').text = ' '.join(soup(markdown.markdown(p['source'], extensions=['tables', 'fenced_code'])).get_text(' ').split())
    write(OUT / 'search.xml', ET.tostring(root, encoding='unicode', xml_declaration=True))
    sitemap = ET.Element('urlset', xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')
    for url in ['/', '/archives/', '/tags/', '/categories/', '/about/'] + [p['url'] for p in POSTS]:
        item = ET.SubElement(sitemap, 'url')
        ET.SubElement(item, 'loc').text = SITE + url
        ET.SubElement(item, 'lastmod').text = DATE
    write(OUT / 'sitemap.xml', ET.tostring(sitemap, encoding='unicode', xml_declaration=True))
    write(OUT / 'robots.txt', f'User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n')
    print(json.dumps({'posts': len(POSTS), 'words': sum(p['words'] for p in POSTS), 'base': BASE, 'output': str(OUT)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
