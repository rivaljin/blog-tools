# Blog publisher — current contract

Main entry: `index.html`. Shared browser logic: `assets/publisher.js`.
New post pages use the same HTML shell plus one `application/json` block with
`id="post-data"` and load `../assets/publisher.js`. Do not copy the JS into new posts.
Existing review pages retain their old code until they need a functional edit.
All publisher entry pages have `noindex`; this is not access control. Do not
add robots.txt disallows or canonical links to the publisher.

## Post data

```json
{
  "title": "Legacy fallback title",
  "title_tistory": "Tistory title",
  "title_naver": "Naver title",
  "link_tistory": "https://s.click.aliexpress.com/e/USER_SUPPLIED_LINK",
  "link_naver": "https://s.click.aliexpress.com/e/USER_SUPPLIED_LINK",
  "tags": "tag1, tag2",
  "bodyTistory": "Tistory draft with [product]({{affiliate_link}})",
  "bodyNaver": "Naver draft with [product]({{affiliate_link}})",
  "featuredImage": "https://example.com/image.webp",
  "images": []
}
```

Old `title` and URL hash payloads remain supported. The two links may be equal.
Link fields do not create AliExpress tracking IDs; users supply generated links.
For new drafts use `{{affiliate_link}}` in Markdown link URLs. Literal legacy
URLs are kept untouched. Platform switching chooses the matching title/link.
Local edits are browser-local; official saved drafts live in Drive/GitHub.

## Publication checks

- Keep the agreed affiliate disclosure visible after the short introduction,
  before the first photo and affiliate link. Never claim self-purchase for gifts.
- Naver: `[사진 NN — description]`, image list and filenames use appearance order.
- Tistory: rendered image HTML, no Naver insertion markers.
- Use `scripts/prepare_review_images.py` for selected photos. Normalize rotation,
  strip EXIF/GPS/XMP, then inspect pixels for order IDs/addresses/faces as needed.
- Do not upload purchase screenshots containing private information.
- Keep metadata inspection separate from visual redaction; metadata removal
  alone does not hide visible text. Keep source originals private and intact.
- Store each platform draft separately as `티스토리 원고` and `네이버 원고` in
  its existing topic folder. Do not mass rename historical drafts.

Detailed editorial rules: existing Google Drive template section 8; operational
decisions: Notion 01_WORKFLOW. Update those when changing the contract.

Run `node tests/publisher.test.cjs` and inspect both tabs in the browser before
publishing a shared script update. Already published blog posts are not changed.
