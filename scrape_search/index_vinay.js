// Importing necessary libraries and modules
import axios from "axios";
import { JSDOM } from "jsdom";
import fs from "fs";
import puppeteer from 'puppeteer';

// Asynchronous self-invoking function
(async () => {
  // Define the search term and encode it for URL usage
  const searchTerm = "Budget Inn Anaheim near Disneyland";
  const encodedSearchTerm = encodeURIComponent(searchTerm);

  // Calculate today and tomorrow's dates for check-in and check-out
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkinDate = today.toISOString().split("T")[0];
  const checkoutDate = tomorrow.toISOString().split("T")[0];

  // Construct the URL with the encoded search term and dates
  const url = `https://www.booking.com/searchresults.en-gb.html?ss=${encodedSearchTerm}&checkin=${checkinDate}&checkout=${checkoutDate}&group_adults=2&no_rooms=1&group_children=0&age=0`;

  console.log('Constructed URL:', url);

  try {
    console.log('Launching browser...');
    // Launch puppeteer browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log('Browser launched.');

    console.log('Setting user agent...');
    // Set user agent to mimic a browser environment
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");
    console.log('User agent set.');

    console.log('Navigating to URL...');
    // Attach console listener to capture broswer page logs -- only for debugging purposes
    //page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Navigate to the constructed URL with specific options for waiting until network activity is idle
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 }); // Increased timeout to 60 seconds
    console.log('Page loaded.');

    console.log('Evaluating page content...');
    // Evaluate and extract data directly from the page using a provided function
    const data = await page.evaluate((searchTerm) => {
      console.log('Inside page.evaluate()');

      // Extract global tracking data from the page
      const utag_data = window.utag_data || {};
      const countryCode = utag_data.user_location || "Unknown";
      const userCurrency = utag_data.currency || "Unknown";
      console.log('Retrieved tracking data:', countryCode, userCurrency);

      // Query and process all property cards on the page
      const cards = Array.from(document.querySelectorAll("[data-testid='property-card']"));
      console.log(`Found ${cards.length} property cards.`);

      return cards.map(card => {
        const title = card.querySelector("[data-testid='title']")?.textContent.trim() ?? "";
        const address = card.querySelector("[data-testid='address']")?.textContent.trim() ?? "";
        
        // Safely navigate the DOM and extract address link
        let full_address_link;
        const addressElement = card.querySelector("[data-testid='address']");
        console.log("Step 1: Address Element", addressElement);
        if (!addressElement) {
          console.error("Address element not found");
          full_address_link = "Address element not found";
        } else {
          const parentElement1 = addressElement.parentElement;
          console.log("Step 2: Parent1 Element", parentElement1);
          const linkElement = parentElement1.parentElement;
          console.log("Step 3: Link Element", linkElement);
          full_address_link = linkElement ? linkElement.href : "No URL found";
          console.log("Step 4: Href or Fallback", full_address_link);
        }

        // Extract additional details for each property
        const price = card.querySelector("[data-testid='price-and-discounted-price']")?.textContent.trim() ?? "";
        const review_count = card.querySelector("[data-testid='review-score']")?.textContent.trim().split(" ").slice(-2)[0] ?? "";
        const score = card.querySelector("[data-testid='review-score']")?.textContent.trim().split(" ")[1] ?? "";
        const location = card.querySelector("[data-testid='location']")?.textContent.trim() ?? "";
        const availabilityRaw = card.querySelector("[data-testid='recommended-units']")?.textContent || "Not specified";
        const splitAvailability = availabilityRaw.split("Only");
        const roomtype = splitAvailability[0].trim();
        const urgency_alert = splitAvailability.length > 1 ? splitAvailability[1].trim() : '';
        const urgency_roomcount = urgency_alert.split(" ")[0] ?? "";
        const location_url = full_address_link;

        console.log(`Processed card: ${title}, ${address}, ${location_url}, ${price}, ${score}, ${review_count},  ${roomtype},, ${urgency_roomcount},`);
        
        return { 
          title, 
          address, 
          location_url,
          review_count,
          score,
          price, 
          roomtype,
          urgency_roomcount,
          searchTerm,
          countryCode,
          userCurrency
        };
      });
    }, searchTerm);

    console.log('Data extraction complete. Output:', data);

    console.log('Closing browser...');
    // Close the browser after completing tasks
    await browser.close();
    console.log('Browser closed.');
  } catch (error) {
    console.error('Error during execution:', error);
  }
})();
