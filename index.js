const puppeteer = require("puppeteer");
const regions = require("./regions.json");
const fs = require("fs");

async function weather(city) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--disable-setuid-sandbox", "--no-sandbox"],
  });
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
    data.push(await weather(country[i]));
    console.log(data[i]);
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
        data[i][j].Weather === "Isolated thunderstorms"
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
  const data = {
    Oceania: await countryCheck(regions.Oceania),
    Africa: await countryCheck(regions.Africa),
    Asia: await countryCheck(regions.Asia),
    Europe: await countryCheck(regions.Europe),
    NorthAmerica: await countryCheck(regions.NorthAmerica),
    SouthAmerica: await countryCheck(regions.SouthAmerica),
    MiddleEast: await countryCheck(regions.MiddleEast),
  };

  fs.writeFileSync("./data.json", JSON.stringify(data));
}

main();
