import { NextResponse } from "next/server";
import { chromium } from "playwright";

export async function POST(req: Request) {
  const { urls } = await req.json();

  if (!urls || urls.length === 0) {
    return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
  }

  console.log(`Received ${urls.length} URLs for scraping`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    });
    const page = await context.newPage();

    const allReviews = [];

    for (const url of urls) {
      console.log(`Processing URL: ${url}`);
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
        console.log(`Page loaded: ${url}`);

        await page.waitForSelector("#productTitle", { timeout: 10000 });
        console.log("Product title found");

        const productTitle = await page.$eval("#productTitle", (el) =>
          el.textContent?.trim()
        );
        console.log(`Product title: ${productTitle}`);

        // Try different selectors for review elements
        let reviewElements = await page.$$('div[data-hook="review"]');
        if (reviewElements.length === 0) {
          reviewElements = await page.$$('div[data-hook="review-card"]');
        }
        if (reviewElements.length === 0) {
          reviewElements = await page.$$(".review");
        }

        console.log(`Found ${reviewElements.length} review elements`);

        for (const reviewElement of reviewElements) {
          try {
            const reviewer =
              (await reviewElement.$eval(".a-profile-name", (el) =>
                el.textContent?.trim()
              )) || "";
            const reviewTitle =
              (await reviewElement.$eval(
                'a[data-hook="review-title"] span, [data-hook="review-title"]',
                (el) => el.textContent?.trim()
              )) || "";
            const rating =
              (await reviewElement.$eval(
                'i[data-hook="review-star-rating"] span, [data-hook="review-star-rating"]',
                (el) => el.textContent?.trim().split(" ")[0]
              )) || "";
            const reviewDate =
              (await reviewElement.$eval(
                'span[data-hook="review-date"]',
                (el) => el.textContent?.trim()
              )) || "";
            const reviewBody =
              (await reviewElement.$eval(
                'span[data-hook="review-body"] span, [data-hook="review-body"]',
                (el) => el.textContent?.trim()
              )) || "";

            allReviews.push({
              product_title: productTitle,
              reviewer,
              review_title: reviewTitle,
              rating,
              review_date: reviewDate,
              review_body: reviewBody,
            });

            console.log(`Scraped review by ${reviewer}`);
          } catch (reviewError) {
            console.error(`Error extracting review data:`, reviewError);
          }
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
      }
    }

    console.log(`Total reviews scraped: ${allReviews.length}`);
    return NextResponse.json(allReviews);
  } catch (error) {
    console.error("Error in scraping process:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred during the scraping process. Please try again.",
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
