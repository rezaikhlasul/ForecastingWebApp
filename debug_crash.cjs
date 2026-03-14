const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.log('======= PAGE ERROR =======');
    console.log(error.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('======= CONSOLE ERROR =======');
      console.log(msg.text());
    }
  });

  console.log("Navigating to app...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  console.log("Clicking 'Try with sample data'");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Try with sample data'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Clicking 'Explore' tab");
  await page.evaluate(() => {
    // The sidebar contains explore
    const navs = Array.from(document.querySelectorAll('.sidebar-item'));
    const btn = navs.find(b => b.textContent && b.textContent.includes('Explore'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 3000));
  console.log("Done waiting");
  
  await browser.close();
})();
