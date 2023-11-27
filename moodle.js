import puppeteer from 'puppeteer';
import path from 'path';

const __dirname = path.resolve();

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Change headless to false for visual debugging
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);

  await page.goto('https://sso.cu.edu.ng:8443/auth/realms/Cu/protocol/saml?SAMLRequest=fZJfb8IgFMW%2FSsN7pa2tVaImTrPMxG1G3R72smB7qyQUOi7sz7cftjO6F58I93J%2Bl3NgjLyWDZs5e1Qb%2BHCANviupULWNibEGcU0R4FM8RqQ2YJtZ48rlvQi1hhtdaEluZLcVnBEMFZoRYLlYkLe82y474%2BqYdXP0yTzu3RQJFFexVEa8dFgEJejPNlne6hI8AoGvXJCPMjLER0sFVqurC9FSRJGWRjHuyhnccbS%2BI0EC%2B9GKG5b1dHaBhmliLpXuB6UrqcObJimfcq9e2qAyxrp3NGzLXryQ4LZ%2Bc5zrdDVYLZgPkUBL5vVhVprXUq4gCmKupFwIvhe6XyvOTYtkWK3JiEvsK124hAbEqz%2FZt8JVQp1uJ3mvjuE7GG3W4fr5%2B2OTMcnNGvTMdMOPKbXtXH34k%2BetlystRTFT3CvTc3t7WGniijDqj3KrOEKBSjr85FSf819fBYmxBoHhE67kf%2F%2F1fQX&RelayState=https%3A%2F%2Fmoodle.cu.edu.ng%2Flogin%2Findex.php');
  await page.setViewport({ width: 1920, height: 1080  });

  const screenshotPathBeforeClick = path.join(__dirname, 'screenshot_before.png');
  const screenshotPathAfterClick = path.join(__dirname, 'screenshot_after.png');

  await page.type('#username', '2100732');
  await page.type('#password', 'david2005');

  await page.screenshot({ path: screenshotPathBeforeClick });
  console.log('Screenshot before click saved at:', screenshotPathBeforeClick);

  const loginButtonSelector = '#kc-login';
  await Promise.all([
    page.waitForNavigation(),
    page.click(loginButtonSelector),
  ]);

  const actionMenuSelector = '.usermenu';
  // await page.content();
  await page.waitForSelector(actionMenuSelector);
  await page.click(actionMenuSelector);

  // const linkDropdownXpath = ;
  // await page.waitForXPath('xpath//*[@id="action-menu-1-menu"]/a[2]');
  // await page.click('xpath//*[@id="action-menu-1-menu"]/a[2]')

  // const linkDropdownXpath ='/html/body/div[3]/nav/ul[2]/li[2]/div/div/div/div/div/div/a[2]';
  // await page.waitForXPath(linkDropdownXpath);
  // const [linkhandle] = await page.$x(linkDropdownXpath);
  // await linkhandle.click();

  const dropdown = await page.waitForSelector('#yui_3_17_2_1_1701069246955_42')
  await dropdown.click()



 // Wait for 3 seconds before taking the screenshot after the click
 await new Promise(resolve => setTimeout(resolve, 3000));

 await Promise.all([
   page.screenshot({ path: screenshotPathAfterClick }),
 ]);
 console.log('Screenshot after click saved at:', screenshotPathAfterClick);


  await browser.close();
})();
