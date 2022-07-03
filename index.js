import puppeteer from "puppeteer";
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const regions = require("./regions.json");
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { doc, setDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxpql2KVn3xHjwJPgrm9W73wkgLIJKeKU",
  authDomain: "rain-makes-me-sad.firebaseapp.com",
  projectId: "rain-makes-me-sad",
  storageBucket: "rain-makes-me-sad.appspot.com",
  messagingSenderId: "206139515579",
  appId: "1:206139515579:web:901de5d874e103b94ebf9e",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const browserConfig = process.env.BROWSERCONFIG || {
  headless: true,
  args: ["--disable-setuid-sandbox", "--no-sandbox"],
};

async function weather(city) {
  const browser = await puppeteer.launch(browserConfig);
  const page = await browser.newPage();
  await page.goto(`https://www.google.com/search?q=weather+${city}`);
  await page.waitForNetworkIdle();
  //   await page.waitForSelector("#wob_dp");
  await page.click("#wob_dp > div:nth-child(3)");
  await page.click("#wob_dp > div:nth-child(1)");

  let weather = [];
  weather.push({ city: city });
  for (let i = 0; i < 8; i++) {
    await page.click(`#wob_dp > div:nth-child(${i + 1})`);

    weather.push(
      await page.evaluate(() => {
        const weather = document.querySelector("#wob_dc");
        const day = document.querySelector("#wob_dts");
        const temp = document.querySelector("#wob_tm");
        return {
          Day: day.innerHTML,
          Weather: weather.innerHTML,
          Temp: temp.innerHTML,
        };
      })
    );
  }
  browser.close();
  return weather;
}

async function countryCheck(country) {
  let data = [];
  for (let i = 0; i < country.length; i++) {
    console.log(`Checking ${country[i]}`);
    data.push(await weather(country[i]));
  }

  const sunny = [];
  for (let i = 1; i < data.length; i++) {
    let rain = false;
    for (let j = 1; j < data[i].length; j++) {
      if (
        data[i][j].Weather === "Rain" ||
        data[i][j].Weather === "Showers" ||
        data[i][j].Weather === "Scattered showers" ||
        data[i][j].Weather === "Cloudy" ||
        data[i][j].Weather === "Mostly cloudy" ||
        data[i][j].Weather === "Thunderstorm" ||
        data[i][j].Weather === "Scattered thunderstorms" ||
        data[i][j].Weather === "Isolated thunderstorms" ||
        data[i][j].Weather === "Cloudy with periodic rain" ||
        data[i][j].Weather === "Cloudy with brief rain"
      ) {
        rain = true;
      }
    }
    if (rain === false) {
      sunny.push(data[i][0].city);
    }
  }
  return sunny;
}

async function main() {
  // const data = {
  //   Oceania: await countryCheck(regions.Oceania),
  //   Africa: await countryCheck(regions.Africa),
  //   Asia: await countryCheck(regions.Asia),
  //   Europe: await countryCheck(regions.Europe),
  //   NorthAmerica: await countryCheck(regions.NorthAmerica),
  //   SouthAmerica: await countryCheck(regions.SouthAmerica),
  //   MiddleEast: await countryCheck(regions.MiddleEast),
  // };
  const regionNames = [
    "Africa",
    "Asia",
    "Europe",
    "NorthAmerica",
    "SouthAmerica",
    "Oceania",
    "MiddleEast",
  ];

  for (let i = 0; i < regionNames.length; i++) {
    console.log(`Checking ${regionNames[i]}`);
    await setDoc(doc(db, "Sunny", regionNames[i]), {});
    const data = await countryCheck(regions[regionNames[i]]);
    for (let j = 0; j < data.length; j++) {
      console.log(`Adding ${data[j]}`);
      await setDoc(
        doc(db, "Sunny", regionNames[i]),
        {
          [data[j]]: true,
        },
        { merge: true }
      );
    }
  }
  process.exit(0);
}

main();
