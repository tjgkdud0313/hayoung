# instagram_scraper_with_images.py

import asyncio
from playwright.async_api import async_playwright
import json

HASHTAG = "팝업"  # 원하는 해시태그
MAX_POSTS = 10    # 수집할 게시물 수

async def scrape_instagram_with_images():
    results = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
        headless=False,
        executable_path=r"C:\Users\OK\Downloads\chrome-win\\chrome.exe",
        args=["--enable-logging=stderr", "--v=1"]
        )
        context = await p.chromium.launch_persistent_context(
        user_data_dir=r"C:\Users\OK\playwright-instagram-profile",
        headless=False,
        executable_path=r"C:\Users\OK\Downloads\chrome-win\chrome.exe",
        args=["--enable-logging=stderr", "--v=1"]
        )
        page = context.pages[0] if context.pages else await context.new_page()

        tag_url = f"https://www.instagram.com/explore/tags/{HASHTAG}/"
        await page.goto(tag_url)
        await page.wait_for_timeout(5000)

        posts = await page.query_selector_all('article a[href^="/p/"]')
        seen = set()

        for post in posts:
            if len(results) >= MAX_POSTS:
                break
            href = await post.get_attribute("href")
            if href and href not in seen:
                seen.add(href)
                post_url = f"https://www.instagram.com{href}"

                # 게시물 상세 페이지 접속
                detail_page = await context.new_page()
                await detail_page.goto(post_url)
                await detail_page.wait_for_timeout(3000)

                # 이미지 URL 추출
                try:
                    img_elem = await detail_page.query_selector('article img')
                    img_url = await img_elem.get_attribute('src') if img_elem else None
                except:
                    img_url = None

                results.append({
                    "post_url": post_url,
                    "image_url": img_url
                })

                await detail_page.close()

        print(json.dumps(results, indent=2))
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_instagram_with_images())