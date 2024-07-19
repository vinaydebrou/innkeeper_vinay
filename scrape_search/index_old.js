import axios from "axios";
import { JSDOM } from "jsdom";
import fs from "fs";

(async () => {
  const searchTerm = encodeURIComponent("Budget Inn Anaheim near disneyland");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkinDate = today.toISOString().split("T")[0];
  const checkoutDate = tomorrow.toISOString().split("T")[0];
  const url = `https://www.booking.com/searchresults.en-gb.html?ss=${searchTerm}&checkin=${checkinDate}&checkout=${checkoutDate}&group_adults=2&no_rooms=1&group_children=0&age=0`;
  console.log(`URL: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "max-age=0",
        "Sec-Ch-Ua":
          '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
      }
    });
    fs.writeFileSync("bookingResponse.html", response.data, "utf-8");

    const { window } = new JSDOM(response.data);

    const propertyCards = window.document.querySelectorAll(
      "[data-testid='property-card']"
    );

    let data = [];

    propertyCards.forEach((card) => {
      const title =
        card.querySelector("[data-testid='title']")?.textContent ?? "";
      const address =
        card.querySelector("[data-testid='address']")?.textContent ?? "";
      // the city could be extrapolated from the address, I don't seem to find it within the dom

      const price =
        card.querySelector("[data-testid='price-and-discounted-price']")
          ?.textContent ?? "";

      let score = "";

      const reviewScoreNode = card.querySelector(
        // here one could also get the number of reviews
        "[data-testid='review-score']"
      );

      if (reviewScoreNode) {
        const scoreText = reviewScoreNode.textContent || "";
        score = scoreText.split(" ")[0];
      }

      data.push({
        title,
        address,
        price,
        score,
        searchTerm,
        countryCode: window.utag_data.user_location,
        userCurrency: window.utag_data.currency
      });
    });

    console.log("Booking response saved to bookingResponse.html");
    console.log(data);
  } catch (error) {
    console.error(error);
  }
})();