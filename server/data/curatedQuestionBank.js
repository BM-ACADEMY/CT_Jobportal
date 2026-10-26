// Curated question bank fallback for campus drives when AI API is unavailable or uncredited.
// 5 diverse sets (50 questions) for each of the 7 skill categories.
const { normalizeSet, QUESTIONS_PER_SET } = require('../utils/campusTest');

const BANK = {
  "digital-marketing": [
    {
      "q": "What does SEO stand for in digital marketing?",
      "opts": {
        "a": "Search Engine Optimization",
        "b": "Social Engine Operation",
        "c": "Sales Enhancement Order",
        "d": "Site Email Outreach"
      },
      "ans": "a",
      "exp": "SEO stands for Search Engine Optimization, improving unpaid search visibility."
    },
    {
      "q": "What does CTR stand for in online advertising?",
      "opts": {
        "a": "Click-Through Rate",
        "b": "Customer Tracking Ratio",
        "c": "Cost-To-Revenue",
        "d": "Content Timing Record"
      },
      "ans": "a",
      "exp": "Click-Through Rate measures the percentage of people who clicked after viewing an ad."
    },
    {
      "q": "Which metric represents the cost paid each time a user clicks on an online advertisement?",
      "opts": {
        "a": "CPC (Cost Per Click)",
        "b": "CPM (Cost Per Mille)",
        "c": "CPA (Cost Per Action)",
        "d": "ROI (Return on Investment)"
      },
      "ans": "a",
      "exp": "CPC is the amount an advertiser pays for each individual click."
    },
    {
      "q": "In email marketing, what is a 'bounce rate'?",
      "opts": {
        "a": "The percentage of sent emails that could not be delivered",
        "b": "The number of users who unsubscribed",
        "c": "The rate at which emails are opened within an hour",
        "d": "The percentage of emails forwarded to friends"
      },
      "ans": "a",
      "exp": "Email bounce rate is the percentage of sent emails rejected by recipient mail servers."
    },
    {
      "q": "Which HTML tag is most critical for defining the title that appears in Google search results?",
      "opts": {
        "a": "<title>",
        "b": "<h1>",
        "c": "<meta description>",
        "d": "<header>"
      },
      "ans": "a",
      "exp": "The <title> tag sets the clickable headline displayed in search engine results pages."
    },
    {
      "q": "What does CTA stand for in website design and marketing?",
      "opts": {
        "a": "Call To Action",
        "b": "Click Tracking Algorithm",
        "c": "Customer Targeted Ad",
        "d": "Cost Total Analysis"
      },
      "ans": "a",
      "exp": "A Call To Action prompts the user to take a specific step, such as 'Buy Now' or 'Sign Up'."
    },
    {
      "q": "Which platform is primarily known for professional B2B networking and hiring?",
      "opts": {
        "a": "LinkedIn",
        "b": "Instagram",
        "c": "Snapchat",
        "d": "Pinterest"
      },
      "ans": "a",
      "exp": "LinkedIn is the dominant professional network for business connections and recruitment."
    },
    {
      "q": "What is 'organic traffic' on a website?",
      "opts": {
        "a": "Visitors who arrive via unpaid search engine results",
        "b": "Visitors coming from paid Google Ads",
        "c": "Visitors directed through billboard hoardings",
        "d": "Automated bot crawls indexing web pages"
      },
      "ans": "a",
      "exp": "Organic traffic refers to visitors who find a website through unpaid search results."
    },
    {
      "q": "In Google Analytics, what does a 'Session' represent?",
      "opts": {
        "a": "A group of user interactions taking place within a given timeframe",
        "b": "The total number of registered accounts",
        "c": "The financial revenue earned in one day",
        "d": "A single image download from a webpage"
      },
      "ans": "a",
      "exp": "A session is a container for user interactions on your website within a specific time window."
    },
    {
      "q": "Which of the following is an example of an on-page SEO factor?",
      "opts": {
        "a": "Optimizing header tags and image alt texts",
        "b": "Getting backlinks from local news websites",
        "c": "Running Facebook carousel ads",
        "d": "Printing flyers for a college festival"
      },
      "ans": "a",
      "exp": "On-page SEO includes optimizing content, headings, and alt tags directly on the website."
    },
    {
      "q": "What is an 'alt tag' used for in web imagery?",
      "opts": {
        "a": "Providing alternative descriptive text for search engines and screen readers",
        "b": "Changing the photo background color automatically",
        "c": "Compressing image file size for mobile browsers",
        "d": "Adding copyright watermarks to pictures"
      },
      "ans": "a",
      "exp": "Alt tags describe images for accessibility screen readers and search crawlers."
    },
    {
      "q": "What does CPM stand for in digital advertising?",
      "opts": {
        "a": "Cost Per Mille (Cost per 1,000 impressions)",
        "b": "Customer Per Month",
        "c": "Clicks Per Minute",
        "d": "Campaign Promotion Margin"
      },
      "ans": "a",
      "exp": "CPM stands for Cost Per Mille, denoting the cost for every 1,000 ad impressions."
    },
    {
      "q": "Which tool is officially provided by Google to monitor website search indexing and search queries?",
      "opts": {
        "a": "Google Search Console",
        "b": "Google Sheets",
        "c": "Google Meet",
        "d": "Google Play Store"
      },
      "ans": "a",
      "exp": "Google Search Console helps webmasters monitor indexing and organic search performance."
    },
    {
      "q": "What is a 'landing page' in digital marketing campaigns?",
      "opts": {
        "a": "A standalone web page created specifically for a marketing campaign",
        "b": "The default browser homepage when opening Chrome",
        "c": "The 404 error page shown when a link is broken",
        "d": "The web hosting server cPanel dashboard"
      },
      "ans": "a",
      "exp": "A landing page is designed to convert visitors who click on a specific campaign or ad."
    },
    {
      "q": "What is A/B testing in online advertising?",
      "opts": {
        "a": "Comparing two versions of an ad or page to see which performs better",
        "b": "Testing website security against alpha and beta cyberattacks",
        "c": "Filtering spam comments from account letter A to letter B",
        "d": "Auditing accounts at the beginning and end of each month"
      },
      "ans": "a",
      "exp": "A/B testing evaluates two variants against each other to identify the higher performing one."
    },
    {
      "q": "What is the primary purpose of remarketing/retargeting ads?",
      "opts": {
        "a": "Showing ads to users who previously visited your website or app",
        "b": "Sending marketing emails to completely random phone contacts",
        "c": "Replacing deleted blog posts with new articles",
        "d": "Hiring competitors' former marketing managers"
      },
      "ans": "a",
      "exp": "Retargeting targets ads to individuals who have already interacted with your brand."
    },
    {
      "q": "Which hashtag best practice is recommended on professional platforms?",
      "opts": {
        "a": "Using 2-4 highly relevant, topical industry tags",
        "b": "Pasting 80 random trending words under every single post",
        "c": "Using punctuation marks inside the middle of a hashtag",
        "d": "Writing whole paragraphs as a single unspaced hashtag"
      },
      "ans": "a",
      "exp": "Targeted, relevant hashtags improve discoverability without looking spammy."
    },
    {
      "q": "What is a 'meta description' in SEO?",
      "opts": {
        "a": "A short snippet summarizing a web page's content in search results",
        "b": "The administrative password for your domain hosting provider",
        "c": "The CSS stylesheet that determines page font sizes",
        "d": "A legal disclaimer required on government tax portals"
      },
      "ans": "a",
      "exp": "A meta description is a ~160 character summary shown below the page title on search results."
    },
    {
      "q": "In social media management, what does 'engagement rate' measure?",
      "opts": {
        "a": "The level of audience interaction (likes, comments, shares) relative to reach",
        "b": "The internet connection speed of the page administrator",
        "c": "The number of hours spent drafting an Instagram caption",
        "d": "The total battery consumption of mobile app users"
      },
      "ans": "a",
      "exp": "Engagement rate quantifies how actively viewers interact with published content."
    },
    {
      "q": "What does KPI stand for in marketing performance reviews?",
      "opts": {
        "a": "Key Performance Indicator",
        "b": "Keyword Placement Index",
        "c": "Knowledge Processing Interface",
        "d": "Known Product Inventory"
      },
      "ans": "a",
      "exp": "A KPI is a measurable value demonstrating how effectively objectives are achieved."
    },
    {
      "q": "Which format is typically best for sharing short-form vertical video on Instagram?",
      "opts": {
        "a": "Reels",
        "b": "IGTV Long Archive",
        "c": "Grid Photo Carousel",
        "d": "Text Notes only"
      },
      "ans": "a",
      "exp": "Instagram Reels is the native format for engaging short-form vertical video."
    },
    {
      "q": "What does 'negative keyword' mean in Google Search Ads?",
      "opts": {
        "a": "A term you exclude to prevent your ad from showing for irrelevant searches",
        "b": "An offensive or prohibited word banned by cyber laws",
        "c": "A keyword that brings free organic clicks",
        "d": "A hashtag used only during consumer complaints"
      },
      "ans": "a",
      "exp": "Negative keywords prevent ads from triggering on queries that waste your budget."
    },
    {
      "q": "What is the typical purpose of an email newsletter?",
      "opts": {
        "a": "Nurturing relationships and keeping subscribers informed of updates",
        "b": "Sending computer software installation files as attachments",
        "c": "Bypassing email spam laws by masking the sender identity",
        "d": "Resetting users' passwords without their knowledge"
      },
      "ans": "a",
      "exp": "Newsletters build brand loyalty by providing regular, valuable content to opted-in users."
    },
    {
      "q": "In web analytics, what does 'bounce rate' indicate for a webpage?",
      "opts": {
        "a": "The percentage of visitors who leave after viewing only a single page",
        "b": "The speed at which a page scrolls when swiping on mobile",
        "c": "The rate of physical mouse movements across the screen",
        "d": "How often a server restarts during high traffic hours"
      },
      "ans": "a",
      "exp": "Bounce rate measures single-page sessions where the user leaves without further interaction."
    },
    {
      "q": "What is 'influencer marketing'?",
      "opts": {
        "a": "Partnering with social creators who have dedicated, engaged followings",
        "b": "Paying news reporters to publish undisclosed gossip articles",
        "c": "Automating fake account likes using server scripts",
        "d": "Cold calling residential telephone directories at night"
      },
      "ans": "a",
      "exp": "Influencer marketing leverages trusted creators to promote products to their audience."
    },
    {
      "q": "What does 'UI/UX' stand for in digital product design?",
      "opts": {
        "a": "User Interface and User Experience",
        "b": "Universal Internet and Universal XML",
        "c": "Unit Inspection and Unit Execution",
        "d": "Unified Input and Unified Output"
      },
      "ans": "a",
      "exp": "UI/UX refers to how digital products look (Interface) and how intuitive they feel (Experience)."
    },
    {
      "q": "What does a canonical tag (`rel='canonical'`) tell search engines?",
      "opts": {
        "a": "Which URL represents the master copy of a duplicate page",
        "b": "That the webpage has zero images and only plain text",
        "c": "To delete the page immediately from all internet caches",
        "d": "The date when the domain name will expire"
      },
      "ans": "a",
      "exp": "Canonical tags prevent duplicate content issues by specifying the preferred URL version."
    },
    {
      "q": "Which metric tells you the total number of individual people who saw your social media post?",
      "opts": {
        "a": "Reach",
        "b": "Impressions",
        "c": "Frequency",
        "d": "Click-Through Count"
      },
      "ans": "a",
      "exp": "Reach counts unique individual viewers, whereas impressions count total display occurrences."
    },
    {
      "q": "Why is mobile responsiveness crucial for modern websites?",
      "opts": {
        "a": "Most web users browse on phones and Google prioritizes mobile-friendly sites",
        "b": "Desktop monitors are no longer capable of loading modern CSS",
        "c": "Websites without mobile versions cannot send email receipts",
        "d": "It automatically reduces domain registration renewal charges"
      },
      "ans": "a",
      "exp": "Mobile-first indexing and high smartphone usage make responsive layouts mandatory."
    },
    {
      "q": "What is a 'lead' in digital sales funnels?",
      "opts": {
        "a": "A potential customer who has shown interest and provided contact details",
        "b": "The senior marketing manager who approves advertising budgets",
        "c": "A cable wire connecting the office server to a broadband router",
        "d": "A customer who has requested a complete payment refund"
      },
      "ans": "a",
      "exp": "A lead is a prospective client who shares contact information indicating buying interest."
    },
    {
      "q": "Which Google ad bidding strategy optimizes for generating the most sales or signups?",
      "opts": {
        "a": "Maximize Conversions",
        "b": "Manual Impression Hoarding",
        "c": "Random Rotation Bidding",
        "d": "Lowest Cost Per Server Reboot"
      },
      "ans": "a",
      "exp": "Maximize Conversions automatically adjusts bids to secure the most conversion actions."
    },
    {
      "q": "What does 'evergreen content' mean in blog publishing?",
      "opts": {
        "a": "Content that remains relevant, useful, and accurate over a long period",
        "b": "Articles that discuss environmental forestry and agriculture only",
        "c": "Posts published exclusively during springtime or rainy seasons",
        "d": "Pages that change their background color to green every Monday"
      },
      "ans": "a",
      "exp": "Evergreen content stays valuable over months and years without becoming outdated."
    },
    {
      "q": "What is Google Business Profile (formerly Google My Business) mainly used for?",
      "opts": {
        "a": "Managing a local business presence on Google Search and Maps",
        "b": "Designing company employee badges and ID cards",
        "c": "Calculating corporate income tax deductions in India",
        "d": "Coding backend database servers using Node.js"
      },
      "ans": "a",
      "exp": "Google Business Profile manages physical store locations, reviews, and hours on Google."
    },
    {
      "q": "What is 'keyword stuffing' and why should it be avoided?",
      "opts": {
        "a": "Unnaturally overloading content with keywords, which search engines penalize",
        "b": "Translating keywords into multiple Indian regional languages",
        "c": "Saving keyword research spreadsheets on an external hard drive",
        "d": "Using short keywords instead of long phrases in titles"
      },
      "ans": "a",
      "exp": "Keyword stuffing creates poor user experience and triggers search engine ranking penalties."
    },
    {
      "q": "Which file on a website instructs search engine bots which pages they should not crawl?",
      "opts": {
        "a": "robots.txt",
        "b": "sitemap.xml",
        "c": "index.html",
        "d": "styles.css"
      },
      "ans": "a",
      "exp": "robots.txt tells search web crawlers which URLs or directories they are disallowed from visiting."
    },
    {
      "q": "What does 'open rate' represent in email campaign tracking?",
      "opts": {
        "a": "The percentage of recipients who opened the delivered email",
        "b": "The time of day when a customer opens their mailbox",
        "c": "How many times an email attachment was unzipped",
        "d": "The percentage of emails that landed in the trash folder"
      },
      "ans": "a",
      "exp": "Open rate is the proportion of delivered emails that recipients actually opened."
    },
    {
      "q": "What is a 'backlink' in SEO terminology?",
      "opts": {
        "a": "A hyperlink on an external website that points back to your website",
        "b": "A browser button used to navigate back to the prior page",
        "c": "A backup copy of website files saved to Google Drive",
        "d": "A link linking the header logo directly to the footer"
      },
      "ans": "a",
      "exp": "Backlinks from trusted external sites signal authority and credibility to search engines."
    },
    {
      "q": "Which type of search query typically indicates strong intent to buy immediately?",
      "opts": {
        "a": "Transactional intent (e.g., 'buy digital marketing course online')",
        "b": "Navigational intent (e.g., 'facebook login')",
        "c": "Informational intent (e.g., 'what is digital marketing')",
        "d": "Casual intent (e.g., 'funny marketing memes')"
      },
      "ans": "a",
      "exp": "Transactional queries indicate the user is looking to purchase or register right away."
    },
    {
      "q": "What is the primary role of a Content Management System (CMS) like WordPress?",
      "opts": {
        "a": "Enabling users to create and manage digital content without writing code",
        "b": "Manufacturing hardware computer chips for servers",
        "c": "Sending physical postal letters to registered office addresses",
        "d": "Monitoring employee internet browsing histories in an office"
      },
      "ans": "a",
      "exp": "A CMS enables non-technical teams to publish, edit, and organize digital website content."
    },
    {
      "q": "What is 'lead nurturing' in digital sales?",
      "opts": {
        "a": "Guiding prospects with helpful content until they are ready to purchase",
        "b": "Calling prospects ten times a day until they block your phone number",
        "c": "Deleting customer contact details after three calendar days",
        "d": "Purchasing unverified candidate email databases from the dark web"
      },
      "ans": "a",
      "exp": "Lead nurturing educates and builds trust with prospective buyers over their decision journey."
    },
    {
      "q": "What does 'ROAS' stand for in advertising analytics?",
      "opts": {
        "a": "Return On Ad Spend",
        "b": "Rate Of Audience Subscription",
        "c": "Reach Over Active Subscribers",
        "d": "Ratio Of Account Security"
      },
      "ans": "a",
      "exp": "ROAS measures gross revenue generated for every rupee or dollar spent on advertising."
    },
    {
      "q": "Why is having an XML sitemap important for a website?",
      "opts": {
        "a": "It provides search engines a comprehensive map of all important URLs to index",
        "b": "It speeds up customer broadband Wi-Fi router download speeds",
        "c": "It prevents users from taking screenshots of your web pages",
        "d": "It is legally mandatory under Indian municipal shop registrations"
      },
      "ans": "a",
      "exp": "An XML sitemap helps search engines discover, crawl, and index all published pages efficiently."
    },
    {
      "q": "What is the purpose of adding UTM parameters to marketing links?",
      "opts": {
        "a": "Tracking the exact source, medium, and campaign of incoming traffic",
        "b": "Encrypting customer credit card numbers during checkout",
        "c": "Translating English webpage text into Tamil automatically",
        "d": "Compressing webpage URL length to under ten characters"
      },
      "ans": "a",
      "exp": "UTM tags reveal which channels, campaigns, and creative ads delivered website visitors."
    },
    {
      "q": "What is 'copywriting' in marketing communications?",
      "opts": {
        "a": "Writing persuasive text designed to prompt reader action or sales",
        "b": "Filing patent and copyright claims with government registries",
        "c": "Copying and pasting competitors' articles onto your own blog",
        "d": "Photocopying paper documents for corporate filing cabinets"
      },
      "ans": "a",
      "exp": "Copywriting is the craft of writing text that motivates an audience to take a desired action."
    },
    {
      "q": "Which social media metric best indicates that viewers found your post highly valuable?",
      "opts": {
        "a": "Saves and Shares",
        "b": "Initial page scroll speed",
        "c": "Number of font colors used",
        "d": "Account registration date"
      },
      "ans": "a",
      "exp": "Saves and shares indicate high content value and reference utility for audience members."
    },
    {
      "q": "What does 'SERP' stand for in search marketing?",
      "opts": {
        "a": "Search Engine Results Page",
        "b": "Social Engagement Rating Platform",
        "c": "Site Error Recovery Process",
        "d": "System Email Relay Protocol"
      },
      "ans": "a",
      "exp": "SERP stands for Search Engine Results Page, the page displayed when you perform a search."
    },
    {
      "q": "What is a 'micro-influencer'?",
      "opts": {
        "a": "A creator with a modest (1K-50K) but highly engaged, niche audience",
        "b": "An influencer who posts videos shorter than three seconds",
        "c": "An automated social media bot with zero human followers",
        "d": "A child actor featured in television soap commercials"
      },
      "ans": "a",
      "exp": "Micro-influencers often deliver higher engagement and niche trust than mega-celebrities."
    },
    {
      "q": "In email marketing, what is 'double opt-in'?",
      "opts": {
        "a": "Requiring subscribers to confirm their email address via a verification link",
        "b": "Sending two identical promotional emails at the exact same moment",
        "c": "Charging customers twice for a single monthly subscription",
        "d": "Subscribing a user to both Facebook and LinkedIn at once"
      },
      "ans": "a",
      "exp": "Double opt-in confirms recipient permission and guarantees inbox deliverability."
    },
    {
      "q": "What is 'brand awareness'?",
      "opts": {
        "a": "How familiar and recognizable a brand is to its target market",
        "b": "The total number of employees working in the legal department",
        "c": "A company's annual electric power consumption figures",
        "d": "The date a company trademark expires at the registrar"
      },
      "ans": "a",
      "exp": "Brand awareness measures consumer recognition and recall of a business or product."
    },
    {
      "q": "What does 'churn rate' measure in subscription services?",
      "opts": {
        "a": "The percentage of customers who cancel or stop paying over a period",
        "b": "The speed at which new products are manufactured in factories",
        "c": "The amount of butter consumed in corporate office cafeterias",
        "d": "The number of new employees hired each quarter"
      },
      "ans": "a",
      "exp": "Churn rate tracks the loss of customers or subscribers over a defined timeframe."
    }
  ],
  "ms-excel": [
    {
      "q": "Which symbol must every Excel formula begin with?",
      "opts": {
        "a": "=",
        "b": "@",
        "c": "#",
        "d": ":"
      },
      "ans": "a",
      "exp": "All formulas in Microsoft Excel must begin with an equal sign (=)."
    },
    {
      "q": "Which function calculates the arithmetic average of numbers in cells A1 through A10?",
      "opts": {
        "a": "=AVERAGE(A1:A10)",
        "b": "=MEAN(A1:A10)",
        "c": "=AVG(A1:A10)",
        "d": "=MEDIAN_TOTAL(A1:A10)"
      },
      "ans": "a",
      "exp": "The =AVERAGE() function computes the arithmetic mean of the specified cell range."
    },
    {
      "q": "What does the $ symbol do in an Excel cell reference like $A$1?",
      "opts": {
        "a": "Locks the row and column so they don't change when copied (absolute reference)",
        "b": "Formats the cell value as US Dollars automatically",
        "c": "Multiplies the cell contents by 100",
        "d": "Hides the cell content from view"
      },
      "ans": "a",
      "exp": "The dollar sign ($) creates an absolute reference that stays fixed when dragging or copying."
    },
    {
      "q": "Which Excel feature allows you to summarize, group, and analyze large datasets without writing formulas?",
      "opts": {
        "a": "Pivot Table",
        "b": "Spell Check",
        "c": "Find and Replace",
        "d": "WordArt"
      },
      "ans": "a",
      "exp": "Pivot Tables are Excel's primary tool for summarizing and slicing multidimensional data."
    },
    {
      "q": "What keyboard shortcut selects all cells in the current worksheet?",
      "opts": {
        "a": "Ctrl + A",
        "b": "Ctrl + S",
        "c": "Ctrl + Z",
        "d": "Ctrl + P"
      },
      "ans": "a",
      "exp": "Ctrl + A highlights the entire dataset or worksheet in Microsoft Excel."
    },
    {
      "q": "Which function counts the number of cells in a range that contain numbers only?",
      "opts": {
        "a": "=COUNT()",
        "b": "=COUNTA()",
        "c": "=COUNTIF()",
        "d": "=NUMCOUNT()"
      },
      "ans": "a",
      "exp": "=COUNT() counts numeric values, while =COUNTA() counts all non-empty cells."
    },
    {
      "q": "What does the Excel error '#DIV/0!' signify?",
      "opts": {
        "a": "The formula is attempting to divide a number by zero or an empty cell",
        "b": "The column width is too narrow to display the number",
        "c": "The formula text contains an unrecognized function name",
        "d": "The referenced worksheet was deleted from the workbook"
      },
      "ans": "a",
      "exp": "#DIV/0! appears when a formula attempts a mathematically impossible division by zero."
    },
    {
      "q": "Which tool changes the background color of a cell automatically based on rules you define (e.g., marks < 40 turn red)?",
      "opts": {
        "a": "Conditional Formatting",
        "b": "Data Validation",
        "c": "Format Painter",
        "d": "Freeze Panes"
      },
      "ans": "a",
      "exp": "Conditional Formatting applies styles dynamically based on cell criteria and values."
    },
    {
      "q": "What is the purpose of 'Freeze Panes' in Excel?",
      "opts": {
        "a": "Keeping top header rows or left columns visible while scrolling through data",
        "b": "Preventing unauthorized colleagues from editing confidential cells",
        "c": "Pausing complex macro calculations to save computer battery",
        "d": "Locking the Excel window so it cannot be minimized"
      },
      "ans": "a",
      "exp": "Freeze Panes keeps header rows or identifier columns stationary during scrolling."
    },
    {
      "q": "Which function joins text from two or more cells together into one cell?",
      "opts": {
        "a": "=CONCATENATE() or =TEXTJOIN()",
        "b": "=MERGE()",
        "c": "=COMBINE()",
        "d": "=ATTACH()"
      },
      "ans": "a",
      "exp": "=CONCATENATE(), =CONCAT(), or =TEXTJOIN() combines strings from different cells."
    },
    {
      "q": "In =VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup]), what does FALSE for range_lookup do?",
      "opts": {
        "a": "Finds an exact match",
        "b": "Finds the closest approximate match",
        "c": "Sorts the column in descending order",
        "d": "Ignores uppercase and lowercase letters"
      },
      "ans": "a",
      "exp": "Setting the range_lookup parameter to FALSE (or 0) requires VLOOKUP to find an exact match."
    },
    {
      "q": "What keyboard shortcut is used to copy selected cells in Excel?",
      "opts": {
        "a": "Ctrl + C",
        "b": "Ctrl + V",
        "c": "Ctrl + X",
        "d": "Ctrl + F"
      },
      "ans": "a",
      "exp": "Ctrl + C copies the selected cells to the clipboard."
    },
    {
      "q": "Which Excel feature restricts data entry to a predefined dropdown list of options?",
      "opts": {
        "a": "Data Validation",
        "b": "Text to Columns",
        "c": "Flash Fill",
        "d": "Goal Seek"
      },
      "ans": "a",
      "exp": "Data Validation allows you to constrain input to specific lists, numbers, or date ranges."
    },
    {
      "q": "What does the error '#####' appearing in a cell mean?",
      "opts": {
        "a": "The column is too narrow to display the complete numeric value or date",
        "b": "The workbook has suffered permanent data corruption",
        "c": "The cell formula has an illegal infinite loop",
        "d": "The computer does not have an active internet connection"
      },
      "ans": "a",
      "exp": "#### occurs when a column is not wide enough; double-clicking the column header fixes it."
    },
    {
      "q": "Which formula counts cells in B2:B20 that equal 'Chennai'?",
      "opts": {
        "a": "=COUNTIF(B2:B20, \"Chennai\")",
        "b": "=COUNT(B2:B20 = \"Chennai\")",
        "c": "=SUMIF(B2:B20, \"Chennai\")",
        "d": "=MATCH(B2:B20, \"Chennai\")"
      },
      "ans": "a",
      "exp": "=COUNTIF(range, criteria) counts cells matching the specified condition."
    },
    {
      "q": "What does pressing F4 do when editing a cell reference in a formula?",
      "opts": {
        "a": "Toggles absolute and relative reference formats ($A$1, A$1, $A1, A1)",
        "b": "Deletes the current formula immediately",
        "c": "Opens the Excel print preview menu",
        "d": "Exports the worksheet as a PDF file"
      },
      "ans": "a",
      "exp": "Pressing F4 cycles through absolute and relative reference modes for selected cell coordinates."
    },
    {
      "q": "What is the result of the formula =IF(10 > 5, \"Pass\", \"Fail\")?",
      "opts": {
        "a": "Pass",
        "b": "Fail",
        "c": "TRUE",
        "d": "#VALUE!"
      },
      "ans": "a",
      "exp": "Since 10 is indeed greater than 5, the IF function returns the true value: 'Pass'."
    },
    {
      "q": "Which tool quickly splits a column containing 'Firstname Lastname' into two separate columns?",
      "opts": {
        "a": "Text to Columns",
        "b": "Remove Duplicates",
        "c": "Consolidate",
        "d": "Conditional Color"
      },
      "ans": "a",
      "exp": "'Text to Columns' separates delimited text (like spaces or commas) into adjacent cells."
    },
    {
      "q": "What keyboard shortcut pastes the clipboard contents?",
      "opts": {
        "a": "Ctrl + V",
        "b": "Ctrl + P",
        "c": "Ctrl + Z",
        "d": "Ctrl + B"
      },
      "ans": "a",
      "exp": "Ctrl + V pastes items from the clipboard into the chosen target cell."
    },
    {
      "q": "Which function sums only the cells in C2:C50 where the corresponding cell in A2:A50 equals 'Sales'?",
      "opts": {
        "a": "=SUMIF(A2:A50, \"Sales\", C2:C50)",
        "b": "=SUM(A2:A50, C2:C50)",
        "c": "=TOTALIF(A2:A50, \"Sales\")",
        "d": "=COUNTIF(C2:C50, \"Sales\")"
      },
      "ans": "a",
      "exp": "=SUMIF(range, criteria, sum_range) totals values that meet a specific single condition."
    },
    {
      "q": "Which formula returns the current date and time together?",
      "opts": {
        "a": "=NOW()",
        "b": "=TODAY()",
        "c": "=CURRENT()",
        "d": "=TIME()"
      },
      "ans": "a",
      "exp": "=NOW() returns the current date and time, while =TODAY() returns only the date."
    },
    {
      "q": "What does the function =UPPER(\"velaivaaipu\") return in Excel?",
      "opts": {
        "a": "VELAIVAAIPU in all capital letters",
        "b": "Error: lowercase input not permitted",
        "c": "The count of uppercase characters (0)",
        "d": "#VALUE! error indicator"
      },
      "ans": "a",
      "exp": "=UPPER() converts all lowercase characters in a text string to uppercase."
    },
    {
      "q": "What does the function =LEN(\"Office\") return?",
      "opts": {
        "a": "6",
        "b": "5",
        "c": "7",
        "d": "Office"
      },
      "ans": "a",
      "exp": "=LEN() counts the number of characters in a string; 'Office' contains 6 characters."
    },
    {
      "q": "Which chart type is best for showing how individual parts contribute to a 100% total?",
      "opts": {
        "a": "Pie Chart",
        "b": "Scatter Plot",
        "c": "Candlestick Chart",
        "d": "Radar Chart"
      },
      "ans": "a",
      "exp": "Pie and Donut charts represent proportional slices of a whole 100% dataset."
    },
    {
      "q": "What is the shortcut to undo your last action in Excel?",
      "opts": {
        "a": "Ctrl + Z",
        "b": "Ctrl + Y",
        "c": "Ctrl + U",
        "d": "Ctrl + D"
      },
      "ans": "a",
      "exp": "Ctrl + Z undoes the most recent action in Excel and Windows applications."
    },
    {
      "q": "Which function finds the highest numerical value in cells E1:E100?",
      "opts": {
        "a": "=MAX(E1:E100)",
        "b": "=TOP(E1:E100)",
        "c": "=HIGH(E1:E100)",
        "d": "=LARGEST(E1:E100)"
      },
      "ans": "a",
      "exp": "=MAX() returns the maximum value in a specified numeric range."
    },
    {
      "q": "What does the function =TRIM(\"  Hello World  \") do?",
      "opts": {
        "a": "Removes leading and trailing spaces, leaving single spaces between words",
        "b": "Deletes all vowels from the sentence",
        "c": "Cuts the text string to a maximum of four letters",
        "d": "Underlines the words with a red border"
      },
      "ans": "a",
      "exp": "=TRIM() strips unnecessary leading, trailing, and repeated spaces from text."
    },
    {
      "q": "How do you select an entire column in an Excel worksheet quickly?",
      "opts": {
        "a": "Click on the column letter header at the top",
        "b": "Double click the bottom right corner of cell A1",
        "c": "Press Shift + Enter three times",
        "d": "Drag the formula bar across the monitor"
      },
      "ans": "a",
      "exp": "Clicking the column letter header (or pressing Ctrl + Space) selects the whole column."
    },
    {
      "q": "What is the main advantage of XLOOKUP over traditional VLOOKUP in modern Excel?",
      "opts": {
        "a": "It can search both left and right and defaults to an exact match without column counting",
        "b": "It can only be used on computers running Mac OS",
        "c": "It replaces all formulas with permanent hardcoded numbers",
        "d": "It automatically saves the file to a USB thumb drive"
      },
      "ans": "a",
      "exp": "XLOOKUP eliminates column index numbers, looks left or right, and handles exact matches by default."
    },
    {
      "q": "Which key combination opens the Find & Replace dialogue box?",
      "opts": {
        "a": "Ctrl + H",
        "b": "Ctrl + K",
        "c": "Ctrl + G",
        "d": "Ctrl + R"
      },
      "ans": "a",
      "exp": "Ctrl + H opens the Replace dialogue box directly in Excel."
    },
    {
      "q": "What does the function =PROPER(\"kamar ahmad\") return in Excel?",
      "opts": {
        "a": "Kamar Ahmad (first letter of each word capitalized)",
        "b": "Error: requires multiple text arguments",
        "c": "Only the very first letter capitalized (Kamar ahmad)",
        "d": "All characters in full uppercase (KAMAR AHMAD)"
      },
      "ans": "a",
      "exp": "=PROPER() capitalizes the first letter of each word in a text string."
    },
    {
      "q": "Which function returns the smallest number in a designated range?",
      "opts": {
        "a": "=MIN()",
        "b": "=LEAST()",
        "c": "=BOTTOM()",
        "d": "=SMALLEST()"
      },
      "ans": "a",
      "exp": "=MIN() returns the minimum numeric value in a dataset."
    },
    {
      "q": "What does the error '#N/A' typically mean in a lookup formula?",
      "opts": {
        "a": "The lookup value was not found in the target table array",
        "b": "The Excel license has expired and needs renewal",
        "c": "The cell formula is missing an equal sign",
        "d": "The calculation took longer than sixty seconds"
      },
      "ans": "a",
      "exp": "#N/A indicates that the lookup formula could not find the search value in the table."
    },
    {
      "q": "How do you start a new line inside the same single Excel cell?",
      "opts": {
        "a": "Alt + Enter",
        "b": "Shift + Space",
        "c": "Ctrl + Enter",
        "d": "Tab + Enter"
      },
      "ans": "a",
      "exp": "Alt + Enter inserts a line break (soft return) inside a single cell."
    },
    {
      "q": "What is the function of the 'Format Painter' tool?",
      "opts": {
        "a": "Copies formatting (fonts, colors, borders) from one cell and applies it to others",
        "b": "Draws freehand digital sketches inside the workbook",
        "c": "Converts text characters into photographic JPEG files",
        "d": "Translates numbers into written Tamil words"
      },
      "ans": "a",
      "exp": "Format Painter replicates cell styles and formatting across other selected cells."
    },
    {
      "q": "Which function allows testing multiple conditions where ALL must be true?",
      "opts": {
        "a": "=AND()",
        "b": "=OR()",
        "c": "=NOT()",
        "d": "=EITHER()"
      },
      "ans": "a",
      "exp": "=AND() returns TRUE only if all tested arguments evaluate to true."
    },
    {
      "q": "What does 'Wrap Text' do to cell contents that exceed the cell width?",
      "opts": {
        "a": "Displays text on multiple lines within the cell so it is completely visible",
        "b": "Deletes the characters that spill outside the cell border",
        "c": "Shrinks the font size to zero until clicked",
        "d": "Moves the remaining characters into column Z"
      },
      "ans": "a",
      "exp": "Wrap Text expands the row height and displays long text across multiple lines."
    },
    {
      "q": "Which shortcut inserts a hyperlink into an Excel cell?",
      "opts": {
        "a": "Ctrl + K",
        "b": "Ctrl + L",
        "c": "Ctrl + H",
        "d": "Ctrl + J"
      },
      "ans": "a",
      "exp": "Ctrl + K is the standard shortcut to insert a hyperlink in Microsoft Office programs."
    },
    {
      "q": "In an Excel table, what does sorting by 'Descending' order mean?",
      "opts": {
        "a": "Arranging data from largest to smallest, or Z to A",
        "b": "Arranging data from smallest to largest, or A to Z",
        "c": "Scrambling the rows in a randomized lottery order",
        "d": "Deleting all duplicate entries automatically"
      },
      "ans": "a",
      "exp": "Descending order arranges numbers from high to low and text from Z to A."
    },
    {
      "q": "Which function returns a specified number of characters from the start (left side) of a text string?",
      "opts": {
        "a": "=LEFT()",
        "b": "=START()",
        "c": "=FIRST()",
        "d": "=BEGIN()"
      },
      "ans": "a",
      "exp": "=LEFT(text, [num_chars]) extracts characters beginning from the left end of a string."
    },
    {
      "q": "What is the result of the formula =5 + 2 * 3 following standard mathematical operator precedence?",
      "opts": {
        "a": "11",
        "b": "21",
        "c": "30",
        "d": "10"
      },
      "ans": "a",
      "exp": "Multiplication happens before addition (2 * 3 = 6, then 5 + 6 = 11)."
    },
    {
      "q": "What is the primary purpose of 'Goal Seek' in Excel?",
      "opts": {
        "a": "Finding the required input value needed to achieve a desired formula result",
        "b": "Searching for misspelled English words across all worksheets",
        "c": "Counting how many hours an employee spent typing",
        "d": "Formatting negative currency numbers in green font"
      },
      "ans": "a",
      "exp": "Goal Seek works backward to determine what input value gives a specific target output."
    },
    {
      "q": "Which function returns the position of a specific item within a designated one-dimensional list?",
      "opts": {
        "a": "=MATCH()",
        "b": "=FINDROW()",
        "c": "=INDEX()",
        "d": "=LOCATE()"
      },
      "ans": "a",
      "exp": "=MATCH() finds the relative position of an item in a range."
    },
    {
      "q": "What does the function =INDEX(array, row_num, [col_num]) do?",
      "opts": {
        "a": "Returns the value at the intersection of a specified row and column",
        "b": "Creates a table of contents on a new worksheet",
        "c": "Sorts the workbook sheets in alphabetical order",
        "d": "Calculates the compound interest on a loan"
      },
      "ans": "a",
      "exp": "=INDEX() retrieves the value at the specified coordinate in a grid."
    },
    {
      "q": "What does the function =ISBLANK(A1) return if cell A1 contains nothing?",
      "opts": {
        "a": "TRUE",
        "b": "FALSE",
        "c": "0",
        "d": "#NULL!"
      },
      "ans": "a",
      "exp": "=ISBLANK() returns TRUE when the referenced cell is empty."
    },
    {
      "q": "Which Excel tool identifies and deletes identical rows from a dataset?",
      "opts": {
        "a": "Remove Duplicates",
        "b": "Consolidate Rows",
        "c": "AutoFilter Clear",
        "d": "Subtotal Wizard"
      },
      "ans": "a",
      "exp": "'Remove Duplicates' (under Data tab) removes duplicate rows based on selected columns."
    },
    {
      "q": "What is a 'workbook' versus a 'worksheet' in Excel?",
      "opts": {
        "a": "A workbook is the entire file containing one or more worksheets",
        "b": "A worksheet is the application program and a workbook is a printer output",
        "c": "A workbook holds only numbers while a worksheet holds only text",
        "d": "They are two completely identical synonyms with no distinction"
      },
      "ans": "a",
      "exp": "An Excel file (.xlsx) is a workbook, which can contain multiple individual worksheets (tabs)."
    },
    {
      "q": "What keyboard shortcut saves the current active workbook?",
      "opts": {
        "a": "Ctrl + S",
        "b": "Ctrl + W",
        "c": "Ctrl + D",
        "d": "Ctrl + E"
      },
      "ans": "a",
      "exp": "Ctrl + S saves the current workbook file."
    },
    {
      "q": "What does the formula =ROUND(14.768, 2) return?",
      "opts": {
        "a": "14.77",
        "b": "14.76",
        "c": "14.80",
        "d": "15.00"
      },
      "ans": "a",
      "exp": "=ROUND(number, 2) rounds to two decimal places; 8 rounds 6 up to 7, yielding 14.77."
    },
    {
      "q": "Which shortcut inserts a new row or cell into a selected range?",
      "opts": {
        "a": "Ctrl + Shift + Plus (+)",
        "b": "Ctrl + Shift + Minus (-)",
        "c": "Alt + Shift + Enter",
        "d": "Ctrl + Shift + R"
      },
      "ans": "a",
      "exp": "Ctrl + Shift + Plus (+) opens the insert dialog for cells, rows, or columns."
    }
  ],
  "accounting": [
    {
      "q": "What is the golden rule of accounting for Real Accounts?",
      "opts": {
        "a": "Debit what comes in, Credit what goes out",
        "b": "Debit the receiver, Credit the giver",
        "c": "Debit all expenses, Credit all incomes",
        "d": "Debit liabilities, Credit assets"
      },
      "ans": "a",
      "exp": "For Real Accounts (assets, cash, machinery), the rule is Debit what comes in, Credit what goes out."
    },
    {
      "q": "What is the golden rule of accounting for Personal Accounts?",
      "opts": {
        "a": "Debit the receiver, Credit the giver",
        "b": "Debit what comes in, Credit what goes out",
        "c": "Debit all losses, Credit all gains",
        "d": "Debit capital, Credit drawings"
      },
      "ans": "a",
      "exp": "For Personal Accounts (customers, vendors, banks), the rule is Debit the receiver, Credit the giver."
    },
    {
      "q": "What is the golden rule of accounting for Nominal Accounts?",
      "opts": {
        "a": "Debit all expenses & losses, Credit all incomes & gains",
        "b": "Debit what goes out, Credit what comes in",
        "c": "Debit the giver, Credit the receiver",
        "d": "Debit goodwill, Credit bad debts"
      },
      "ans": "a",
      "exp": "Nominal accounts (rent, salary, sales) follow: Debit expenses & losses, Credit incomes & gains."
    },
    {
      "q": "What is the primary purpose of a Balance Sheet?",
      "opts": {
        "a": "Presenting the financial position (Assets = Liabilities + Equity) at a specific date",
        "b": "Listing everyday tea and snacks expenses in an office",
        "c": "Recording attendance timestamps of shop floor workers",
        "d": "Listing customer complaints received during the quarter"
      },
      "ans": "a",
      "exp": "A Balance Sheet reports assets, liabilities, and owner's equity as of a particular date."
    },
    {
      "q": "In Tally, which function key is used to record a Payment voucher?",
      "opts": {
        "a": "F5",
        "b": "F4",
        "c": "F6",
        "d": "F8"
      },
      "ans": "a",
      "exp": "In Tally, F5 is the standard shortcut to open and record Payment vouchers."
    },
    {
      "q": "In Tally, which voucher type is used for Contra entries (cash deposited into or withdrawn from a bank)?",
      "opts": {
        "a": "F4 (Contra)",
        "b": "F6 (Receipt)",
        "c": "F7 (Journal)",
        "d": "F9 (Purchase)"
      },
      "ans": "a",
      "exp": "F4 Contra is used for internal transfers between Cash and Bank accounts."
    },
    {
      "q": "What is a 'Sundry Creditor' in business bookkeeping?",
      "opts": {
        "a": "A supplier to whom the business owes money for goods or services purchased on credit",
        "b": "A customer who owes money to the business for credit sales",
        "c": "A bank manager who sanctions business loans",
        "d": "An employee who receives an annual festival bonus"
      },
      "ans": "a",
      "exp": "Sundry Creditors are suppliers/vendors to whom a company owes payment."
    },
    {
      "q": "What is a 'Sundry Debtor'?",
      "opts": {
        "a": "A customer who owes money to the business for goods or services sold on credit",
        "b": "An investor who bought preference shares in the company",
        "c": "A vendor who delivered office stationery with an invoice",
        "d": "A tax officer who issues an assessment order"
      },
      "ans": "a",
      "exp": "Sundry Debtors are customers who have purchased on credit and owe money to the company."
    },
    {
      "q": "What does GST stand for in the Indian taxation system?",
      "opts": {
        "a": "Goods and Services Tax",
        "b": "Government Sales Tariff",
        "c": "General Standard Taxation",
        "d": "Gross Statutory Tax"
      },
      "ans": "a",
      "exp": "GST stands for Goods and Services Tax, implemented across India in July 2017."
    },
    {
      "q": "What is the accounting equation upon which double-entry bookkeeping is built?",
      "opts": {
        "a": "Assets = Liabilities + Capital (Owner's Equity)",
        "b": "Assets + Liabilities = Capital",
        "c": "Capital = Assets + Liabilities",
        "d": "Revenue = Expenses - Liabilities"
      },
      "ans": "a",
      "exp": "The fundamental accounting equation is Assets = Liabilities + Capital."
    },
    {
      "q": "In an intra-state sale (within the same state like Tamil Nadu), which two GST components are charged?",
      "opts": {
        "a": "CGST and SGST",
        "b": "IGST and UTGST",
        "c": "IGST only",
        "d": "CGST only"
      },
      "ans": "a",
      "exp": "Intra-state sales split the tax equally into Central GST (CGST) and State GST (SGST)."
    },
    {
      "q": "Which tax component is charged on inter-state sales (e.g., from Tamil Nadu to Karnataka)?",
      "opts": {
        "a": "IGST (Integrated GST)",
        "b": "CGST only",
        "c": "SGST only",
        "d": "Customs Duty"
      },
      "ans": "a",
      "exp": "Inter-state sales across state borders attract Integrated Goods and Services Tax (IGST)."
    },
    {
      "q": "What is 'Depreciation' in accounting?",
      "opts": {
        "a": "The gradual reduction in the monetary value of a fixed asset over time due to wear and tear",
        "b": "A penalty charged by banks for issuing bad cheques",
        "c": "A discount offered to customers who pay within ten days",
        "d": "An increase in product market price during festival seasons"
      },
      "ans": "a",
      "exp": "Depreciation allocates the cost of a tangible fixed asset over its useful operational life."
    },
    {
      "q": "In Tally, which function key opens the Receipt voucher entry screen?",
      "opts": {
        "a": "F6",
        "b": "F5",
        "c": "F7",
        "d": "F8"
      },
      "ans": "a",
      "exp": "F6 is the Tally shortcut for recording receipts of cash or bank deposits from customers."
    },
    {
      "q": "In Tally, which voucher type is used for Sales transactions?",
      "opts": {
        "a": "F8",
        "b": "F9",
        "c": "F5",
        "d": "F4"
      },
      "ans": "a",
      "exp": "F8 is the standard shortcut in Tally for recording Sales vouchers."
    },
    {
      "q": "In Tally, which voucher type is used for Purchase transactions?",
      "opts": {
        "a": "F9",
        "b": "F8",
        "c": "F6",
        "d": "F7"
      },
      "ans": "a",
      "exp": "F9 is the shortcut in Tally for entering Purchase vouchers."
    },
    {
      "q": "What is 'Petty Cash' kept for in an office?",
      "opts": {
        "a": "Small day-to-day miscellaneous cash expenses like tea, courier, or local auto fare",
        "b": "Purchasing industrial factory manufacturing machinery",
        "c": "Paying annual corporate income tax assessments",
        "d": "Disbursing executive monthly salary cheques"
      },
      "ans": "a",
      "exp": "Petty cash handles routine small incidental payments that do not warrant issuing cheques."
    },
    {
      "q": "What is a 'Trial Balance' used for?",
      "opts": {
        "a": "Verifying that the sum of all debit balances equals the sum of all credit balances",
        "b": "Filing quarterly employee provident fund returns with the EPFO",
        "c": "Printing price tags for garments in a retail store",
        "d": "Calculating daily overtime hours for factory technicians"
      },
      "ans": "a",
      "exp": "A Trial Balance tests arithmetical accuracy by verifying total debits match total credits."
    },
    {
      "q": "What is 'Working Capital'?",
      "opts": {
        "a": "Current Assets minus Current Liabilities",
        "b": "Fixed Assets minus Long-Term Loans",
        "c": "Total Bank Loans plus Share Capital",
        "d": "Gross Profit minus Income Tax"
      },
      "ans": "a",
      "exp": "Working Capital = Current Assets - Current Liabilities, measuring short-term liquidity."
    },
    {
      "q": "What does the 'Accrual Concept' in accounting require?",
      "opts": {
        "a": "Revenues and expenses are recognized when earned or incurred, regardless of when cash moves",
        "b": "Transactions are recorded only after physical hard cash is counted",
        "c": "All business books must be closed at midnight on December 31",
        "d": "Companies cannot purchase goods unless full payment is in the bank"
      },
      "ans": "a",
      "exp": "Under accrual accounting, income and expenses are recognized in the period they occur, not when cash is settled."
    },
    {
      "q": "What is a 'Journal Voucher' (F7 in Tally) primarily used for?",
      "opts": {
        "a": "Non-cash adjustment entries, provisions, and depreciation",
        "b": "Withdrawing cash from the ATM",
        "c": "Depositing cash into the petty cash box",
        "d": "Printing warehouse delivery challans"
      },
      "ans": "a",
      "exp": "F7 Journal handles non-cash adjustments, write-offs, transfers, and year-end provisions."
    },
    {
      "q": "What is 'Goodwill' classified as in an accounting Balance Sheet?",
      "opts": {
        "a": "An Intangible Asset",
        "b": "A Current Liability",
        "c": "A Fictitious Expense",
        "d": "A Tangible Fixed Asset"
      },
      "ans": "a",
      "exp": "Goodwill is an intangible fixed asset representing enterprise reputation and brand value."
    },
    {
      "q": "What is a 'Credit Note' issued for?",
      "opts": {
        "a": "Acknowledging that an amount has been credited to a customer's account (e.g. sales returns)",
        "b": "Demanding immediate cash payment from a defaulting debtor",
        "c": "Authorizing a bank overdraft facility for the business",
        "d": "Applying for an electricity meter connection for a factory"
      },
      "ans": "a",
      "exp": "A seller issues a Credit Note to reduce the invoice value due to goods returned or discount."
    },
    {
      "q": "What is a 'Debit Note' issued for?",
      "opts": {
        "a": "Informing a supplier that their account has been debited (e.g. purchase returns)",
        "b": "Requesting a bank to issue a new cheque book",
        "c": "Confirming that an employee's leave has been sanctioned",
        "d": "Announcing an annual general meeting to company shareholders"
      },
      "ans": "a",
      "exp": "A Debit Note is sent to a vendor when goods are returned or short-received."
    },
    {
      "q": "What does 'TDS' stand for in Indian direct taxation?",
      "opts": {
        "a": "Tax Deducted at Source",
        "b": "Total Deposit Scheme",
        "c": "Trade Discount Standard",
        "d": "Tariff Division Service"
      },
      "ans": "a",
      "exp": "TDS stands for Tax Deducted at Source, collected under the Income Tax Act."
    },
    {
      "q": "What is the difference between Gross Profit and Net Profit?",
      "opts": {
        "a": "Gross profit subtracts COGS; Net profit also subtracts all operating expenses, interest, and taxes",
        "b": "Gross profit includes income tax while Net profit excludes sales revenue",
        "c": "Gross profit is calculated annually while Net profit is calculated every 10 years",
        "d": "They are completely identical financial terms"
      },
      "ans": "a",
      "exp": "Gross Profit = Revenue - Cost of Goods Sold. Net Profit = Gross Profit - Operating Expenses & Taxes."
    },
    {
      "q": "In accounting, what is a 'Prepaid Expense'?",
      "opts": {
        "a": "An expense paid in advance whose benefit extends into future accounting periods (an asset)",
        "b": "An expense that was never paid and will result in legal action",
        "c": "A salary advance requested by a newly hired intern",
        "d": "A penalty paid for delayed filing of company returns"
      },
      "ans": "a",
      "exp": "Prepaid expenses (like annual insurance premiums) are current assets until consumed."
    },
    {
      "q": "What is 'Outstanding Salary' classified as on a Balance Sheet?",
      "opts": {
        "a": "Current Liability",
        "b": "Fixed Asset",
        "c": "Intangible Asset",
        "d": "Direct Income"
      },
      "ans": "a",
      "exp": "Salary due to staff but not yet disbursed is an outstanding current liability."
    },
    {
      "q": "What is a 'Bank Reconciliation Statement' (BRS) prepared for?",
      "opts": {
        "a": "Reconciling the differences between the company Cash Book bank balance and the Bank Passbook",
        "b": "Applying for a new business credit card with reward points",
        "c": "Reporting financial fraud to the local cyber police station",
        "d": "Approving festival bonus payments for office executives"
      },
      "ans": "a",
      "exp": "A BRS reconciles timing and transaction differences between the cash book and bank statement."
    },
    {
      "q": "Which financial statement shows cash inflows and outflows from operating, investing, and financing activities?",
      "opts": {
        "a": "Cash Flow Statement",
        "b": "Balance Sheet",
        "c": "Trading Account",
        "d": "Stock Ledger"
      },
      "ans": "a",
      "exp": "A Cash Flow Statement details operational, investment, and financing liquidity flows."
    },
    {
      "q": "What is an 'Invoice'?",
      "opts": {
        "a": "A commercial document issued by a seller detailing goods/services provided and amount owed",
        "b": "A legal notice issued by a magistrate court in an eviction dispute",
        "c": "A company certificate proving that an intern worked for 30 days",
        "d": "A receipt acknowledging physical cash received over a counter"
      },
      "ans": "a",
      "exp": "An invoice is a formal bill requesting payment for products or services supplied."
    },
    {
      "q": "What is 'Bad Debt' in business accounting?",
      "opts": {
        "a": "A receivable from a debtor that has been determined to be uncollectible",
        "b": "A high-interest personal loan taken from an unauthorized lender",
        "c": "A loan taken by a company director to buy a personal sports car",
        "d": "A vendor invoice that was entered twice by mistake"
      },
      "ans": "a",
      "exp": "Bad debts are unrecoverable receivables written off as business losses."
    },
    {
      "q": "In Tally, which key combination is used to alter an existing ledger or voucher?",
      "opts": {
        "a": "Ctrl + Enter",
        "b": "Alt + F4",
        "c": "Ctrl + Z",
        "d": "Shift + Esc"
      },
      "ans": "a",
      "exp": "Ctrl + Enter while on a ledger name in Tally opens its alteration screen directly."
    },
    {
      "q": "What is 'Stock / Inventory' classified as on the Balance Sheet?",
      "opts": {
        "a": "Current Asset",
        "b": "Fixed Asset",
        "c": "Current Liability",
        "d": "Capital Reserve"
      },
      "ans": "a",
      "exp": "Closing stock of goods held for sale is classified as a Current Asset."
    },
    {
      "q": "What does 'E-Way Bill' refer to in GST compliance?",
      "opts": {
        "a": "An electronically generated document required for moving goods worth over ₹50,000",
        "b": "An electricity payment receipt downloaded from a municipal power board",
        "c": "A digital airline boarding pass for corporate executive travel",
        "d": "A toll gate FASTag transaction receipt for transport trucks"
      },
      "ans": "a",
      "exp": "E-Way Bill is mandatory under GST rules for physical transport of consignments above ₹50,000."
    },
    {
      "q": "What is the normal balance of an Asset account?",
      "opts": {
        "a": "Debit",
        "b": "Credit",
        "c": "Zero",
        "d": "Negative"
      },
      "ans": "a",
      "exp": "Assets normally carry debit balances; an increase is debited and a decrease is credited."
    },
    {
      "q": "What is the normal balance of a Liability account?",
      "opts": {
        "a": "Credit",
        "b": "Debit",
        "c": "Neutral",
        "d": "Variable"
      },
      "ans": "a",
      "exp": "Liabilities normally carry credit balances; an increase is credited and a decrease is debited."
    },
    {
      "q": "What is 'Revenue Expenditure' versus 'Capital Expenditure'?",
      "opts": {
        "a": "Revenue expenditure benefits the current period (routine expenses); Capital expenditure benefits multiple future years (buying assets)",
        "b": "Revenue expenditure is illegal while Capital expenditure is tax-exempt",
        "c": "Revenue expenditure is incurred only by government departments",
        "d": "They are two names for identical office stationery expenses"
      },
      "ans": "a",
      "exp": "Revenue expenses maintain day-to-day operations; capital expenses acquire or improve long-term assets."
    },
    {
      "q": "What does the abbreviation 'HSN' stand for in GST billing?",
      "opts": {
        "a": "Harmonized System of Nomenclature",
        "b": "High Standard Number",
        "c": "Hourly Service Note",
        "d": "Hardware Serialization Network"
      },
      "ans": "a",
      "exp": "HSN is an internationally standardized commodity classification code used for GST rates."
    },
    {
      "q": "What does 'SAC' stand for in Indian GST invoicing for services?",
      "opts": {
        "a": "Services Accounting Code",
        "b": "Standard Assessment Certificate",
        "c": "Statutory Audit Committee",
        "d": "Sales Allocation Category"
      },
      "ans": "a",
      "exp": "SAC (Services Accounting Code) is used to classify and tax services under GST."
    },
    {
      "q": "What is a Balance Confirmation letter used for?",
      "opts": {
        "a": "Verifying account balances directly with customers and suppliers during audit",
        "b": "Opening a savings account for an office intern",
        "c": "Requesting a corporate credit card limit upgrade",
        "d": "Filing local municipal property taxes"
      },
      "ans": "a",
      "exp": "Balance confirmations verify debtor and creditor statement balances independently."
    },
    {
      "q": "What is the purpose of an Audit Trail (edit log) in modern accounting software like Tally Prime?",
      "opts": {
        "a": "Tracking every modification and deletion made to vouchers with user and timestamp",
        "b": "Automatically deleting vouchers older than 30 days",
        "c": "Printing invoices in three different colors",
        "d": "Calculating daily broadband data consumption"
      },
      "ans": "a",
      "exp": "Audit trails record changes made to transactions for compliance with MCA guidelines."
    },
    {
      "q": "What is an Asset Register maintained for in a company?",
      "opts": {
        "a": "Listing all fixed assets owned, their location, purchase cost, and accumulated depreciation",
        "b": "Recording daily attendance of temporary office workers",
        "c": "Tracking employee personal mobile phone models",
        "d": "Keeping track of office tea and snack packets"
      },
      "ans": "a",
      "exp": "A fixed asset register tracks asset descriptions, locations, serial numbers, and depreciation."
    },
    {
      "q": "What is a Proforma Invoice?",
      "opts": {
        "a": "A preliminary bill sent to a buyer in advance of goods shipment or delivery",
        "b": "A final legal tax document that cannot be amended",
        "c": "A receipt confirming physical cash deposit into a bank",
        "d": "A fine notice issued by an income tax assessing officer"
      },
      "ans": "a",
      "exp": "A proforma invoice is an estimated quotation sent before delivery and commercial invoicing."
    },
    {
      "q": "What does FIFO mean in inventory valuation?",
      "opts": {
        "a": "First In, First Out (oldest stock purchased is recorded as sold first)",
        "b": "Fast Inventory Fast Output",
        "c": "Final Income Fixed Obligation",
        "d": "Financial Investment Forecast Order"
      },
      "ans": "a",
      "exp": "FIFO assumes that the earliest purchased inventory is sold first."
    },
    {
      "q": "What is a Purchase Order (PO)?",
      "opts": {
        "a": "A buyer’s commercial document indicating types, quantities, and agreed prices for products",
        "b": "A delivery truck registration permit issued by traffic police",
        "c": "A cheque issued to settle employee travel allowances",
        "d": "A certificate given to interns after completing their training"
      },
      "ans": "a",
      "exp": "A PO is a formal purchase authorization sent from buyer to supplier."
    },
    {
      "q": "What is a Delivery Challan used for?",
      "opts": {
        "a": "Accompanying goods during transportation to acknowledge delivery without pricing details",
        "b": "A fine issued for driving without a valid license",
        "c": "A bank slip used to deposit paper cheques",
        "d": "An employee identity card for entering office buildings"
      },
      "ans": "a",
      "exp": "A delivery challan confirms shipment dispatch and recipient receipt of goods."
    },
    {
      "q": "What does ITC stand for in Indian GST accounting?",
      "opts": {
        "a": "Input Tax Credit",
        "b": "Internal Tariff Calculation",
        "c": "Income Tax Clearance",
        "d": "Interstate Trade Certificate"
      },
      "ans": "a",
      "exp": "ITC allows businesses to reduce output tax liability by the tax paid on business inputs."
    },
    {
      "q": "What is an Imprest System in petty cash management?",
      "opts": {
        "a": "Replenishing spent funds to maintain a constant fixed float at the start of each period",
        "b": "Investing petty cash funds into cryptocurrency",
        "c": "Keeping petty cash locked without spending any money for a year",
        "d": "Distributing cash to employees as random gifts"
      },
      "ans": "a",
      "exp": "Under the imprest system, the exact amount spent is reimbursed to restore the float balance."
    },
    {
      "q": "What is a Contingent Liability?",
      "opts": {
        "a": "A potential future liability that may occur depending on the outcome of an uncertain event (like a pending lawsuit)",
        "b": "A guaranteed debt that must be paid tomorrow",
        "c": "The physical cash balance inside the office safe",
        "d": "An annual subscription fee for accounting software"
      },
      "ans": "a",
      "exp": "Contingent liabilities are recorded in notes to financial accounts if probable or possible."
    }
  ],
  "graphic-design": [
    {
      "q": "What is the primary color mode used for digital screens (websites, phones, TVs)?",
      "opts": {
        "a": "RGB (Red, Green, Blue)",
        "b": "CMYK (Cyan, Magenta, Yellow, Black)",
        "c": "Grayscale only",
        "d": "Pantone Metallic"
      },
      "ans": "a",
      "exp": "RGB is an additive color model designed specifically for glowing digital displays."
    },
    {
      "q": "What is the standard color mode used for commercial offset and physical color printing?",
      "opts": {
        "a": "CMYK (Cyan, Magenta, Yellow, Black)",
        "b": "RGB (Red, Green, Blue)",
        "c": "Hexadecimal 6-digit",
        "d": "Binary 8-bit"
      },
      "ans": "a",
      "exp": "CMYK is the subtractive four-color printing standard used for physical printed media."
    },
    {
      "q": "In Canva, what does the 'Lock' feature on an element do?",
      "opts": {
        "a": "Prevents the element from being accidentally moved or edited on the canvas",
        "b": "Requires a password for anyone opening the graphic file",
        "c": "Encrypts the image so it cannot be viewed on smartphones",
        "d": "Converts the color palette into black and white"
      },
      "ans": "a",
      "exp": "Locking an element keeps it in place while you arrange and adjust surrounding graphics."
    },
    {
      "q": "What is 'White Space' (or Negative Space) in graphic design?",
      "opts": {
        "a": "The unmarked, empty area around and between design elements that creates breathing room",
        "b": "An error caused by a broken printer toner cartridge",
        "c": "A design that is only permitted to use white paint",
        "d": "The border margins required by municipal tax offices"
      },
      "ans": "a",
      "exp": "Negative space declutters layouts and directs visual focus to key elements."
    },
    {
      "q": "Which file format supports transparent backgrounds for logos and icons?",
      "opts": {
        "a": "PNG",
        "b": "JPEG",
        "c": "BMP",
        "d": "MP3"
      },
      "ans": "a",
      "exp": "PNG supports an alpha transparency channel, making it ideal for cut-out logos."
    },
    {
      "q": "What is the difference between a 'Serif' font and a 'Sans-serif' font?",
      "opts": {
        "a": "Serif fonts have small decorative strokes (feet) at the ends of letter strokes; Sans-serif fonts do not",
        "b": "Serif fonts can only be typed in capital letters",
        "c": "Sans-serif fonts are exclusively used on government stamp papers",
        "d": "Serif fonts cannot be displayed on computer screens"
      },
      "ans": "a",
      "exp": "'Sans' means without; sans-serif fonts (like Arial or Inter) lack decorative end strokes."
    },
    {
      "q": "What standard resolution (DPI) is considered optimal for high-quality physical print publications?",
      "opts": {
        "a": "300 DPI",
        "b": "72 DPI",
        "c": "12 DPI",
        "d": "1000 DPI"
      },
      "ans": "a",
      "exp": "300 DPI is the universal baseline resolution for sharp, professional physical print."
    },
    {
      "q": "What standard resolution (PPI) is traditional for standard website and screen images?",
      "opts": {
        "a": "72 to 96 PPI",
        "b": "600 PPI",
        "c": "1200 PPI",
        "d": "10 PPI"
      },
      "ans": "a",
      "exp": "Standard digital screens historically use 72 to 96 PPI for fast web loading."
    },
    {
      "q": "What does 'Visual Hierarchy' mean in layout design?",
      "opts": {
        "a": "Arranging elements to show their order of importance, guiding the viewer's eye naturally",
        "b": "Organizing office graphic designers by their years of corporate seniority",
        "c": "Making every single word on a flyer the exact same size and bold weight",
        "d": "Using only the most expensive brand colors available"
      },
      "ans": "a",
      "exp": "Visual hierarchy leads the reader's attention from headlines to supporting details."
    },
    {
      "q": "What are 'Complementary Colors' on the color wheel?",
      "opts": {
        "a": "Colors situated directly opposite each other on the color wheel (e.g., blue and orange)",
        "b": "Colors that are always given to clients for free without charging",
        "c": "Colors that look completely identical under sunlight",
        "d": "Shades that can only be generated using artificial intelligence"
      },
      "ans": "a",
      "exp": "Complementary colors sit opposite on the color wheel and produce high visual contrast."
    },
    {
      "q": "What is the primary advantage of a vector graphic (such as an SVG or AI file)?",
      "opts": {
        "a": "It can be scaled to any size infinitely without losing clarity or becoming pixelated",
        "b": "It can play audio voiceovers when clicked",
        "c": "It is automatically translated into multiple regional languages",
        "d": "It uses less than 1 kilobyte on every computer hard drive"
      },
      "ans": "a",
      "exp": "Vectors are mathematically defined paths, so they scale cleanly from business cards to billboards."
    },
    {
      "q": "What is the standard aspect ratio for an Instagram square post?",
      "opts": {
        "a": "1:1",
        "b": "16:9",
        "c": "9:16",
        "d": "4:3"
      },
      "ans": "a",
      "exp": "1:1 (e.g. 1080x1080 px) is the classic square format for feed posts."
    },
    {
      "q": "What is the standard aspect ratio for an Instagram Story or Reel?",
      "opts": {
        "a": "9:16 (vertical 1080x1920 px)",
        "b": "16:9 (horizontal)",
        "c": "1:1 (square)",
        "d": "21:9 (cinematic wide)"
      },
      "ans": "a",
      "exp": "Vertical stories and reels follow the 9:16 full-screen smartphone ratio."
    },
    {
      "q": "In Canva, what tool allows you to align multiple graphic elements neatly along their centers or edges?",
      "opts": {
        "a": "Position / Align (Tidy Up)",
        "b": "Filter Blur",
        "c": "Background Remover",
        "d": "Draw Pencil"
      },
      "ans": "a",
      "exp": "The Position/Align menu aligns items left, center, right, top, bottom, or evenly spaced."
    },
    {
      "q": "Why should you avoid using more than 2 or 3 different font families in a single marketing poster?",
      "opts": {
        "a": "Using too many fonts creates visual clutter and impairs readability",
        "b": "Computer operating systems automatically crash if four fonts are opened",
        "c": "Printers charge extra royalty fees for every additional font family printed",
        "d": "Google Search bans web pages that showcase different fonts"
      },
      "ans": "a",
      "exp": "Limiting font choices maintains visual coherence, professionalism, and scannability."
    },
    {
      "q": "What does 'Leading' (line-height) refer to in typography?",
      "opts": {
        "a": "The vertical distance between consecutive lines of text",
        "b": "The horizontal spacing between two adjacent letters",
        "c": "The person in the design team who assigns daily tasks",
        "d": "The first capital letter of a newspaper article"
      },
      "ans": "a",
      "exp": "Leading is the vertical space between lines of type; proper leading prevents overlapping."
    },
    {
      "q": "What does 'Kerning' refer to in typography?",
      "opts": {
        "a": "Adjusting the horizontal space between individual character pairs",
        "b": "Converting text into italic cursive handwriting",
        "c": "Adding a drop shadow behind a headline",
        "d": "Coloring the inside of letters with gold gradient"
      },
      "ans": "a",
      "exp": "Kerning adjusts spacing between specific letter pairs (like 'AV') for optical balance."
    },
    {
      "q": "What is the purpose of a 'Brand Style Guide' or 'Brand Kit'?",
      "opts": {
        "a": "Ensuring consistent use of logos, colors, typography, and imagery across all company assets",
        "b": "Listing the retail purchase prices of competitor products",
        "c": "Calculating the monthly overtime wages of graphic designers",
        "d": "Protecting computer keyboards against coffee spills"
      },
      "ans": "a",
      "exp": "A brand kit maintains visual consistency across marketing materials and social media."
    },
    {
      "q": "Which file format is ideal for saving high-resolution photographs where small file size is needed?",
      "opts": {
        "a": "JPEG",
        "b": "GIF",
        "c": "TXT",
        "d": "WAV"
      },
      "ans": "a",
      "exp": "JPEG utilizes lossy compression suited for rich photographs with subtle gradations."
    },
    {
      "q": "What is a 'Color Palette' in design?",
      "opts": {
        "a": "A curated combination of harmonious colors chosen for a project or brand",
        "b": "A wooden board used only for oil painting in art schools",
        "c": "A software plugin that changes monitor brightness at night",
        "d": "A barcode scanned at retail supermarket checkout counters"
      },
      "ans": "a",
      "exp": "A color palette sets the cohesive primary, secondary, and accent colors for a brand."
    },
    {
      "q": "What is 'Contrast' and why is it important when choosing text and background colors?",
      "opts": {
        "a": "The difference in luminance or color that makes text easily distinguishable and readable from its background",
        "b": "The time it takes to upload an image to an Instagram account",
        "c": "The legal contract signed between a freelancer and an agency",
        "d": "The number of megabytes an image occupies in memory"
      },
      "ans": "a",
      "exp": "Adequate contrast (e.g. dark text on light background) is essential for readability and accessibility."
    },
    {
      "q": "What is a 'watermark' used for on graphic assets?",
      "opts": {
        "a": "A subtle, semi-transparent mark or logo identifying authorship and protecting against unauthorized reuse",
        "b": "A special filter that makes photos appear as if underwater",
        "c": "An ink stain indicating physical damage during printing",
        "d": "A digital stamp showing current atmospheric humidity"
      },
      "ans": "a",
      "exp": "Watermarks protect original creative work from unauthorized downloading or misuse."
    },
    {
      "q": "What is 'Bleed' in physical print preparation?",
      "opts": {
        "a": "Artwork that extends beyond the trimmed edge to ensure no white borders appear after cutting",
        "b": "Accidental ink spillage on the floor of a printing press",
        "c": "The process of washing printed t-shirts in hot water",
        "d": "A software bug that turns all text red"
      },
      "ans": "a",
      "exp": "Bleed extends graphics 3mm past the cut line so trimming variations leave no white paper edges."
    },
    {
      "q": "What is a 'Thumbnail' image?",
      "opts": {
        "a": "A small, reduced-size preview image used to represent a video or article",
        "b": "A photograph taken exclusively using a smartphone camera flash",
        "c": "An icon that measures the exact physical width of an adult thumb",
        "d": "A medical illustration of human hand anatomy"
      },
      "ans": "a",
      "exp": "Thumbnails are compact visual previews that entice clicks on YouTube and social feeds."
    },
    {
      "q": "Which tool in Canva or Photoshop removes the solid background behind a portrait photo?",
      "opts": {
        "a": "Background Remover",
        "b": "Color Invert",
        "c": "Lens Flare",
        "d": "Mosaic Pixelate"
      },
      "ans": "a",
      "exp": "Background Remover isolates subjects so they can be placed on clean custom backdrops."
    },
    {
      "q": "What is an 'infographic'?",
      "opts": {
        "a": "A visual representation of information or data designed to present complex topics quickly and clearly",
        "b": "A text-only legal notice published in a government gazette",
        "c": "An audio podcast interview uploaded to Spotify",
        "d": "A spreadsheet with thousands of raw numeric rows"
      },
      "ans": "a",
      "exp": "Infographics blend concise copy, charts, and illustrations to make data easy to digest."
    },
    {
      "q": "What does 'Opacity' adjust in design software?",
      "opts": {
        "a": "The degree of transparency or solidness of an element or layer",
        "b": "The physical weight of the computer display screen",
        "c": "The speed at which an animation plays back in seconds",
        "d": "The volume of background music in an Instagram video"
      },
      "ans": "a",
      "exp": "100% opacity is completely solid; lowering opacity makes the element translucent."
    },
    {
      "q": "Why is proofreading all text before exporting final designs essential?",
      "opts": {
        "a": "Typographical and spelling errors damage brand credibility and waste print budgets",
        "b": "Graphic design software deletes files automatically if spelling is wrong",
        "c": "Printers refuse to print designs containing the letter Z",
        "d": "It is required to keep computers from overheating"
      },
      "ans": "a",
      "exp": "Proofreading prevents costly reprints and maintains professional reputation."
    },
    {
      "q": "What is a 'Grid System' in graphic design layout?",
      "opts": {
        "a": "A framework of vertical and horizontal guide lines used to organize and align content structured and neatly",
        "b": "The electrical wiring supplying power to a design studio",
        "c": "A graph paper notebook used only for hand calculations",
        "d": "A security fence installed around an industrial printing press"
      },
      "ans": "a",
      "exp": "Grids establish consistent alignment, balance, and rhythm across pages and screens."
    },
    {
      "q": "What is a 'Mockup' in graphic design presentations?",
      "opts": {
        "a": "A realistic digital preview showing how a design will look on an actual product (e.g. t-shirt, book, phone)",
        "b": "An insulting review written by a competitor about your artwork",
        "c": "A rough pencil scribble thrown into an office wastebasket",
        "d": "A counterfeit currency note printed during a demonstration"
      },
      "ans": "a",
      "exp": "Mockups showcase designs in realistic context for clients and portfolio presentations."
    },
    {
      "q": "What does CMYK stand for in graphic printing?",
      "opts": {
        "a": "Cyan, Magenta, Yellow, Key (Black)",
        "b": "Crimson, Mustard, Yellow, Khaki",
        "c": "Computer Monospace Yellow Kerning",
        "d": "Color Matrix Yield Key"
      },
      "ans": "a",
      "exp": "CMYK is the 4-color process printing standard: Cyan, Magenta, Yellow, and Key (Black)."
    },
    {
      "q": "What is a Moodboard in design concepting?",
      "opts": {
        "a": "A visual collage of images, typography, and colors that establishes design direction",
        "b": "An electrical circuit board controlling monitor backlights",
        "c": "A mood tracking questionnaire filled out by creative directors",
        "d": "A scoreboard tracking daily completed Photoshop exports"
      },
      "ans": "a",
      "exp": "Moodboards visually align teams and clients on aesthetic direction and emotional tone."
    },
    {
      "q": "What is a Favicon on a website?",
      "opts": {
        "a": "The small square icon shown on the browser tab next to the page title",
        "b": "The company logo printed on staff t-shirts",
        "c": "The hero photo on the homepage",
        "d": "The privacy policy link at the bottom of the webpage"
      },
      "ans": "a",
      "exp": "Favicons are 16x16 or 32x32 px icons representing sites in browser tab bars."
    },
    {
      "q": "What does DPI mean in printing resolution?",
      "opts": {
        "a": "Dots Per Inch",
        "b": "Digital Photo Interface",
        "c": "Data Pixel Index",
        "d": "Direct Print Input"
      },
      "ans": "a",
      "exp": "DPI measures printing density; 300 DPI is the print publishing standard."
    },
    {
      "q": "What is a Call-to-Action (CTA) button in banner design?",
      "opts": {
        "a": "A prominent visual button inviting user action (e.g., Apply Now or Shop Today)",
        "b": "A disclaimer note about copyright licensing",
        "c": "The company registration number",
        "d": "A hidden watermark protecting vector illustrations"
      },
      "ans": "a",
      "exp": "CTA buttons guide viewers to the next intended conversion step."
    },
    {
      "q": "What is Kerning in typography?",
      "opts": {
        "a": "Adjusting horizontal space between two specific letters for visual harmony",
        "b": "Rotating letters 90 degrees upside down",
        "c": "Underlining all consonants in a sentence",
        "d": "Converting English letters into geometric circles"
      },
      "ans": "a",
      "exp": "Kerning balances awkward spacing between particular letter pairs."
    },
    {
      "q": "What is the Rule of Thirds in visual composition?",
      "opts": {
        "a": "Dividing an image with 2 horizontal and 2 vertical lines and placing focal points at intersections",
        "b": "Printing three copies of every poster design",
        "c": "Using only three colors on any marketing graphic",
        "d": "Charging clients one third of the cost in advance"
      },
      "ans": "a",
      "exp": "The Rule of Thirds positions key elements along a 3x3 grid for balanced visual energy."
    },
    {
      "q": "What is a Monochromatic color scheme?",
      "opts": {
        "a": "Using variations in lightness and saturation of a single base hue",
        "b": "Combining every color in the visible rainbow together",
        "c": "Using only neon green and hot pink",
        "d": "A design that contains zero text and only photography"
      },
      "ans": "a",
      "exp": "Monochromatic designs explore tints, shades, and tones of one single color."
    },
    {
      "q": "What is the purpose of an image mask in Canva or Photoshop?",
      "opts": {
        "a": "Hiding or revealing portions of an image within a specific container shape without deleting pixels",
        "b": "Changing the computer screen brightness automatically",
        "c": "Compressing JPEG images into zip files",
        "d": "Applying a copyright notice across the center of an image"
      },
      "ans": "a",
      "exp": "Masks non-destructively shape images into frames or hide sections cleanly."
    },
    {
      "q": "What is a Raster image made of?",
      "opts": {
        "a": "A grid of individual pixels that lose quality when scaled up",
        "b": "Mathematical curves and anchor coordinates",
        "c": "Pure audio voice frequencies",
        "d": "Plain text characters"
      },
      "ans": "a",
      "exp": "Raster graphics (like JPEG and PNG) are pixel-based and pixelate when enlarged."
    },
    {
      "q": "What is Typography in graphic arts?",
      "opts": {
        "a": "The style, arrangement, and appearance of printed or displayed letters and text",
        "b": "The speed at which a person types on a mechanical keyboard",
        "c": "A legal patent protecting computer software code",
        "d": "The manufacturing process of computer plastic keycaps"
      },
      "ans": "a",
      "exp": "Typography organizes text visually for legibility, impact, and aesthetic appeal."
    },
    {
      "q": "What does Saturation refer to in color theory?",
      "opts": {
        "a": "The intensity, purity, or vividness of a color",
        "b": "The temperature of a printing press machine",
        "c": "The physical weight of heavy cardstock paper",
        "d": "The amount of black ink remaining in a desktop printer"
      },
      "ans": "a",
      "exp": "High saturation produces vibrant, pure colors; desaturation produces muted grays."
    },
    {
      "q": "What is a Gradient in background design?",
      "opts": {
        "a": "A gradual, smooth transition between two or more colors",
        "b": "A jagged zigzag border running along the top of an ad",
        "c": "A photo that has been converted to black and white",
        "d": "A font that cannot be resized"
      },
      "ans": "a",
      "exp": "Gradients blend colors smoothly across linear or radial directions."
    },
    {
      "q": "Which tool in design software copies a color directly from an image or element?",
      "opts": {
        "a": "Eyedropper / Color Picker",
        "b": "Eraser",
        "c": "Lasso",
        "d": "Magnifying Glass"
      },
      "ans": "a",
      "exp": "The eyedropper samples exact RGB or Hex color values from any pixel."
    },
    {
      "q": "What is an Asset Library in digital design tools?",
      "opts": {
        "a": "A central collection of reusable brand logos, icons, fonts, and photos",
        "b": "A physical room where graphic designers borrow textbooks",
        "c": "A computer hard drive used only for saving movies",
        "d": "A spreadsheet tracking daily office stationery purchases"
      },
      "ans": "a",
      "exp": "Asset libraries store approved brand elements for rapid reuse and team consistency."
    },
    {
      "q": "What is the purpose of the Alignment tool in layouts?",
      "opts": {
        "a": "Arranging elements along a common axis so edges and centers line up neatly",
        "b": "Rotating an image 180 degrees backwards",
        "c": "Translating text from French to English",
        "d": "Deleting invisible layers automatically"
      },
      "ans": "a",
      "exp": "Alignment creates visual order and structure across text, buttons, and graphics."
    },
    {
      "q": "What is a GIF file format commonly used for?",
      "opts": {
        "a": "Short animated looping graphics with limited color palettes",
        "b": "Printing 100-page color magazines on glossy paper",
        "c": "High-fidelity multi-track audio recordings",
        "d": "Spreadsheet formula calculations"
      },
      "ans": "a",
      "exp": "GIFs are lightweight image formats supporting simple looping animations."
    },
    {
      "q": "What is Tracking (letter-spacing) in typography?",
      "opts": {
        "a": "Adjusting the uniform horizontal spacing across an entire word or line of text",
        "b": "Following an employee’s GPS coordinates during business hours",
        "c": "Counting how many people viewed a billboard poster",
        "d": "Measuring the physical thickness of a poster frame"
      },
      "ans": "a",
      "exp": "Tracking uniformly tightens or expands spacing across a line of text."
    },
    {
      "q": "What is a Focal Point in a graphic poster?",
      "opts": {
        "a": "The primary center of interest or visual emphasis that draws the viewer’s eye first",
        "b": "The optical center of the camera lens that took the photograph",
        "c": "The physical spot where a nail is hammered to hang a poster",
        "d": "The bottom right corner where the printer serial number appears"
      },
      "ans": "a",
      "exp": "A focal point anchors the design and commands immediate attention."
    },
    {
      "q": "What is the standard size of an Indian business card in inches?",
      "opts": {
        "a": "3.5 x 2.0 inches",
        "b": "8.5 x 11.0 inches",
        "c": "1.0 x 1.0 inch",
        "d": "5.0 x 7.0 inches"
      },
      "ans": "a",
      "exp": "Standard business cards measure 3.5 inches wide by 2.0 inches tall."
    }
  ],
  "communication": [
    {
      "q": "What is the best practice for a professional workplace email subject line?",
      "opts": {
        "a": "Clear, concise, and summarizing the email's topic (e.g., 'Leave Request - Oct 25 - John')",
        "b": "Leaving the subject line completely blank to build mystery",
        "c": "Writing 'URGENT PLEASE READ ALL CAPS RIGHT NOW!!!'",
        "d": "Typing an entire three-paragraph message inside the subject line"
      },
      "ans": "a",
      "exp": "A clear, concise subject line helps recipients prioritize and find messages quickly."
    },
    {
      "q": "In an email, what is the difference between 'CC' and 'BCC'?",
      "opts": {
        "a": "CC recipients are visible to everyone; BCC recipients are hidden from other recipients",
        "b": "CC sends emails only to computers; BCC sends emails only to mobile phones",
        "c": "BCC emails are delivered 24 hours later than CC emails",
        "d": "CC is free while BCC requires purchasing digital postal stamps"
      },
      "ans": "a",
      "exp": "Carbon Copy (CC) shows all email addresses; Blind Carbon Copy (BCC) keeps them confidential."
    },
    {
      "q": "What does 'Active Listening' involve during a business conversation or interview?",
      "opts": {
        "a": "Focusing completely on the speaker, understanding their point, and asking clarifying questions without interrupting",
        "b": "Nodding continuously while checking social media on your smartphone",
        "c": "Preparing your counter-argument while the other person is still speaking",
        "d": "Speaking louder than everyone else in the conference room"
      },
      "ans": "a",
      "exp": "Active listening focuses on understanding the speaker before formulating a response."
    },
    {
      "q": "Which greeting is most appropriate when writing a formal email to a new client or interviewer whose name is unknown?",
      "opts": {
        "a": "Dear Hiring Team / Dear Sir or Madam",
        "b": "Hey bro whats up",
        "c": "Yo listen to me",
        "d": "Sup folks"
      },
      "ans": "a",
      "exp": "'Dear Hiring Team' or 'Dear [Team/Role]' sets a respectful, professional tone."
    },
    {
      "q": "What should you do before sending an important email with an attachment mentioned in the body?",
      "opts": {
        "a": "Verify that the file is actually attached and that recipient addresses are correct",
        "b": "Disconnect your computer Wi-Fi so the email stays in drafts",
        "c": "Delete the attachment immediately after writing about it",
        "d": "Forward the email to five random contacts for luck"
      },
      "ans": "a",
      "exp": "Always double-check that promised attachments are enclosed and email addresses are accurate."
    },
    {
      "q": "Which response demonstrates professional ownership when you realize you made a mistake at work?",
      "opts": {
        "a": "\"I apologize for the oversight. Here is how I am correcting it, and the steps I've taken to prevent it recurring.\"",
        "b": "\"It wasn't my fault, the intern gave me bad information.\"",
        "c": "\"Nobody saw it happen, so let's pretend everything is fine.\"",
        "d": "\"Why is everyone always blaming me for minor problems?\""
      },
      "ans": "a",
      "exp": "Owning mistakes calmly with an immediate solution demonstrates integrity and maturity."
    },
    {
      "q": "What is an appropriate professional way to conclude a formal business email?",
      "opts": {
        "a": "Sincerely / Best regards,",
        "b": "C ya later,",
        "c": "Whatever,",
        "d": "Thx bye,"
      },
      "ans": "a",
      "exp": "'Sincerely', 'Best regards', or 'Warm regards' are classic professional sign-offs."
    },
    {
      "q": "What does non-verbal communication include?",
      "opts": {
        "a": "Body language, facial expressions, eye contact, and posture",
        "b": "Sending voice notes on WhatsApp",
        "c": "Writing a long message in calligraphy font",
        "d": "Leaving an automated voicemail greeting"
      },
      "ans": "a",
      "exp": "Non-verbal cues encompass posture, facial expressions, gestures, and eye contact."
    },
    {
      "q": "Which of the following sentences has correct subject-verb agreement?",
      "opts": {
        "a": "The team members are ready for the meeting.",
        "b": "The team members is ready for the meeting.",
        "c": "The team members was ready for the meeting.",
        "d": "The team members am ready for the meeting."
      },
      "ans": "a",
      "exp": "Plural subject ('team members') takes the plural verb 'are'."
    },
    {
      "q": "Why is typing workplace messages entirely in CAPITAL LETTERS considered poor etiquette?",
      "opts": {
        "a": "It is perceived as shouting or being angry at the reader",
        "b": "Computers consume twice as much battery power to display capital letters",
        "c": "It automatically routes the message into the recipient's spam folder",
        "d": "Capital letters cannot be read on Android devices"
      },
      "ans": "a",
      "exp": "All-caps text feels aggressive, like shouting, and is harder to read."
    },
    {
      "q": "What is the recommended approach when receiving constructive criticism from a team supervisor?",
      "opts": {
        "a": "Listen open-mindedly, thank them for the feedback, and seek actionable ways to improve",
        "b": "Argue immediately and explain why the supervisor is incorrect",
        "c": "Storm out of the office and ignore messages for two days",
        "d": "Post a negative complaint on public social media forums"
      },
      "ans": "a",
      "exp": "Constructive criticism is an opportunity for professional skill growth."
    },
    {
      "q": "When answering a customer service phone call, what should your initial opening statement include?",
      "opts": {
        "a": "A polite greeting, your company name, your name, and an offer to assist",
        "b": "Asking the caller why they are disturbing your lunch break",
        "c": "Demanding their credit card number before saying hello",
        "d": "Remaining completely silent until the caller speaks three times"
      },
      "ans": "a",
      "exp": "Professional phone greetings identify who you are and welcome the caller cordially."
    },
    {
      "q": "Which sentence is grammatically correct?",
      "opts": {
        "a": "She has been working here for two years.",
        "b": "She has been working here since two years.",
        "c": "She is working here since two years ago.",
        "d": "She was work here for two years."
      },
      "ans": "a",
      "exp": "'For' is used for periods of time ('for two years'); 'since' specifies a point in time."
    },
    {
      "q": "What does the abbreviation 'FYI' mean in workplace correspondence?",
      "opts": {
        "a": "For Your Information",
        "b": "Follow Your Instincts",
        "c": "Find Your Invoice",
        "d": "Free Yearly Insurance"
      },
      "ans": "a",
      "exp": "FYI stands for 'For Your Information', used when sharing context that requires no action."
    },
    {
      "q": "What does 'EOD' mean in a project deadline email?",
      "opts": {
        "a": "End Of Day (usually close of business hours, e.g. 5:00 or 6:00 PM)",
        "b": "Early Overdue Delivery",
        "c": "Error On Delivery",
        "d": "Every Other Day"
      },
      "ans": "a",
      "exp": "EOD indicates that an item is expected before the workday finishes."
    },
    {
      "q": "What is the purpose of an 'Elevator Pitch'?",
      "opts": {
        "a": "A concise, persuasive 30-to-60 second introduction of yourself or an idea",
        "b": "A speech delivered exclusively inside a moving elevator",
        "c": "A technical blueprint explaining how elevator cables function",
        "d": "A speech given by a building security guard during an emergency"
      },
      "ans": "a",
      "exp": "An elevator pitch summarizes your value proposition in the time of an elevator ride."
    },
    {
      "q": "Which sentence correctly uses 'their', 'there', or 'they're'?",
      "opts": {
        "a": "They're going to submit their report over there.",
        "b": "Their going to submit there report over they're.",
        "c": "There going to submit they're report over their.",
        "d": "They're going to submit there report over their."
      },
      "ans": "a",
      "exp": "They're = They are; their = possessive; there = location."
    },
    {
      "q": "In professional communication, what is empathy?",
      "opts": {
        "a": "Understanding and sharing the feelings and perspectives of another person",
        "b": "Agreeing to everything a customer demands regardless of company policy",
        "c": "Pretending to care while writing a negative note behind their back",
        "d": "Giving financial cash loans to colleagues without interest"
      },
      "ans": "a",
      "exp": "Empathy builds trust by demonstrating that you understand the customer's situation."
    },
    {
      "q": "When leaving a professional voicemail, what key information should you leave?",
      "opts": {
        "a": "Your name, company, the reason for calling, and a return phone number spoken clearly",
        "b": "A long explanation of your entire life history and childhood memories",
        "c": "Playing your favorite recorded music for three minutes",
        "d": "Demanding they call back in five seconds without giving your number"
      },
      "ans": "a",
      "exp": "Clear voicemails include your name, contact number, and a brief statement of purpose."
    },
    {
      "q": "What is the primary benefit of maintaining professional eye contact during an interview?",
      "opts": {
        "a": "It conveys confidence, engagement, honesty, and attentiveness",
        "b": "It intimidates the interviewer into offering a higher starting salary",
        "c": "It prevents the interviewer from writing notes on your resume",
        "d": "It is a requirement under government labor employment laws"
      },
      "ans": "a",
      "exp": "Comfortable, natural eye contact reflects confidence and active engagement."
    },
    {
      "q": "Which phrase is the most polite way to request assistance from a busy colleague?",
      "opts": {
        "a": "\"When you have a moment, could you please help me clarify this report?\"",
        "b": "\"Stop what you are doing right now and look at this.\"",
        "c": "\"You must help me immediately because I don't know what to do.\"",
        "d": "\"If you don't help me, I will complain to the director.\""
      },
      "ans": "a",
      "exp": "Courteous requests respect your colleague's workload and schedule."
    },
    {
      "q": "What does 'cross-cultural communication' require in diverse workplaces?",
      "opts": {
        "a": "Respect for different communication styles, patience, and avoiding slang or idioms",
        "b": "Insisting that everyone speak only one dialect without exception",
        "c": "Avoiding speaking to colleagues who come from other states",
        "d": "Using complicated technical jargon in every conversation"
      },
      "ans": "a",
      "exp": "Cultural sensitivity, simple clear phrasing, and mutual respect bridge diverse teams."
    },
    {
      "q": "Which sentence uses the apostrophe correctly for possession?",
      "opts": {
        "a": "The manager's decision was communicated to all staff.",
        "b": "The managers decision was communicated to all staff.",
        "c": "The manager's were all present in the hall.",
        "d": "The managers's decision was communicated."
      },
      "ans": "a",
      "exp": "'Manager's' shows singular possession by the manager."
    },
    {
      "q": "What is the main goal of writing a meeting agenda before a conference call?",
      "opts": {
        "a": "Ensuring participants know the discussion topics, goals, and preparation needed",
        "b": "Preventing employees from eating snacks during the meeting",
        "c": "Calculating the electricity cost of running the meeting room projector",
        "d": "Listing which team members are wearing formal shoes"
      },
      "ans": "a",
      "exp": "Agendas keep meetings focused, productive, and respectful of everyone's time."
    },
    {
      "q": "What does 'tone of voice' convey in customer and peer conversations?",
      "opts": {
        "a": "The attitude, mood, and emotional intention behind the spoken words",
        "b": "The exact decibel volume measured by an audio engineer",
        "c": "Whether the speaker is using an Apple or Android device",
        "d": "The geographical altitude of the office building"
      },
      "ans": "a",
      "exp": "Tone reflects warmth, respect, irritation, or empathy beyond the literal words."
    },
    {
      "q": "What should you do if an interviewer asks a question you do not know the answer to?",
      "opts": {
        "a": "\"I haven't encountered that specific scenario yet, but here is how I would research and resolve it.\"",
        "b": "Invent a completely made-up story with false numbers and hope they don't notice",
        "c": "Refuse to answer and accuse the interviewer of being unfair",
        "d": "Stare at the ceiling in complete silence until they change the subject"
      },
      "ans": "a",
      "exp": "Honesty combined with a logical problem-solving approach impresses interviewers."
    },
    {
      "q": "What does 'conciseness' mean in business writing?",
      "opts": {
        "a": "Expressing ideas clearly and completely in the fewest necessary words",
        "b": "Writing at least twenty paragraphs for every routine inquiry",
        "c": "Using obscure dictionary words to sound highly intellectual",
        "d": "Deleting all punctuation marks to save visual space"
      },
      "ans": "a",
      "exp": "Concise writing respects the reader's time by eliminating redundant fluff."
    },
    {
      "q": "Which of the following is an open-ended question that encourages detailed feedback?",
      "opts": {
        "a": "\"What aspects of our training program did you find most useful?\"",
        "b": "\"Did you like the training? Yes or no?\"",
        "c": "\"Is today Thursday?\"",
        "d": "\"Did you finish reading the book?\""
      },
      "ans": "a",
      "exp": "Open-ended questions begin with what, how, or why and elicit qualitative insights."
    },
    {
      "q": "What is a 'minutes of the meeting' (MoM) document?",
      "opts": {
        "a": "A written record of the decisions made, key discussions, and assigned action items",
        "b": "A stopwatch countdown measuring how long each speaker spoke",
        "c": "A list of employee arrival times for disciplinary deductions",
        "d": "A menu of drinks ordered during the tea break"
      },
      "ans": "a",
      "exp": "MoM captures agreed decisions, responsibilities, and target deadlines."
    },
    {
      "q": "Why is proofreading important before publishing a LinkedIn post or resume?",
      "opts": {
        "a": "First impressions matter; clean spelling and grammar project competence and care",
        "b": "LinkedIn bans user profiles that contain more than two commas",
        "c": "Resume applicant tracking systems reject files that have paragraphs",
        "d": "Spelling mistakes automatically reduce the screen brightness"
      },
      "ans": "a",
      "exp": "Attention to detail in written materials reflects your everyday professional work quality."
    },
    {
      "q": "What does etiquette mean in professional business environments?",
      "opts": {
        "a": "The customary code of polite and respectful behavior in workplace settings",
        "b": "The legal incorporation documents of a private limited company",
        "c": "The speed of internet connections in corporate office towers",
        "d": "A special badge worn exclusively by visiting directors"
      },
      "ans": "a",
      "exp": "Etiquette ensures mutual respect, professionalism, and smooth teamwork."
    },
    {
      "q": "What is the primary role of a subject line in a sales outreach email?",
      "opts": {
        "a": "Encouraging the recipient to open the email by highlighting relevant value",
        "b": "Listing the company’s bank account details for immediate deposit",
        "c": "Pasting the entire company history in three sentences",
        "d": "Threatening legal action if the email is ignored"
      },
      "ans": "a",
      "exp": "Compelling, relevant subject lines drive email open rates."
    },
    {
      "q": "What is paraphrasing in active listening?",
      "opts": {
        "a": "Restating the speaker’s points in your own words to confirm mutual understanding",
        "b": "Repeating the speaker’s exact words in a mocking tone",
        "c": "Interrupting the speaker every thirty seconds with a story",
        "d": "Writing down notes in shorthand that nobody else can decipher"
      },
      "ans": "a",
      "exp": "Paraphrasing demonstrates attentiveness and prevents costly misunderstandings."
    },
    {
      "q": "Which channel is typically most appropriate for delivering sensitive constructive feedback to an employee?",
      "opts": {
        "a": "A private one-on-one conversation",
        "b": "A public company-wide WhatsApp group announcement",
        "c": "A comment posted under their personal LinkedIn profile",
        "d": "An anonymous handwritten note left on the office reception desk"
      },
      "ans": "a",
      "exp": "Constructive feedback should always be delivered privately and respectfully."
    },
    {
      "q": "What does the term jargon refer to in workplace communication?",
      "opts": {
        "a": "Specialized words or expressions used by a profession that are difficult for outsiders to understand",
        "b": "A foreign language spoken only in northern Europe",
        "c": "Misspelled English words found on informal social media feeds",
        "d": "The sound made by noisy office air-conditioning compressors"
      },
      "ans": "a",
      "exp": "Overusing industry jargon confuses non-specialist clients and teammates."
    },
    {
      "q": "When leading a virtual video conference, what is good microphone etiquette?",
      "opts": {
        "a": "Keeping your microphone muted when not speaking to eliminate background noise",
        "b": "Leaving the microphone unmuted while having conversations with family members",
        "c": "Tapping your pen directly against the microphone during presentations",
        "d": "Shouting into the microphone so everyone knows you are present"
      },
      "ans": "a",
      "exp": "Muting when not speaking keeps conference calls clear and distraction-free."
    },
    {
      "q": "What does assertive communication mean?",
      "opts": {
        "a": "Expressing your views and needs clearly and respectfully without being aggressive or passive",
        "b": "Shouting and demanding that your ideas always be accepted",
        "c": "Agreeing to everything everyone says even when you strongly disagree",
        "d": "Refusing to speak to colleagues during stressful project deadlines"
      },
      "ans": "a",
      "exp": "Assertiveness balances clarity, confidence, and respect for others."
    },
    {
      "q": "What is a cover letter when applying for a job?",
      "opts": {
        "a": "A personalized one-page letter explaining why you are an ideal fit for the specific role and company",
        "b": "A decorative plastic binder sheet protecting your printed resume",
        "c": "A signed letter from a bank stating your account balance",
        "d": "A certificate confirming that you passed your driving test"
      },
      "ans": "a",
      "exp": "A cover letter introduces your background and demonstrates role motivation."
    },
    {
      "q": "In professional meetings, what does staying on agenda mean?",
      "opts": {
        "a": "Focusing discussions strictly on the pre-planned topics and goals of the meeting",
        "b": "Sitting in the exact same chair for every meeting",
        "c": "Writing your signature in cursive ink on every document",
        "d": "Checking the wall clock every forty seconds"
      },
      "ans": "a",
      "exp": "Staying on agenda ensures meeting time is utilized efficiently."
    },
    {
      "q": "What is the purpose of an Executive Summary in a lengthy report?",
      "opts": {
        "a": "Providing busy decision-makers a quick overview of key findings, conclusions, and recommendations",
        "b": "Listing the personal phone numbers of all company executives",
        "c": "Printing a glossary of dictionary definitions",
        "d": "Explaining why the report author deserves a promotion"
      },
      "ans": "a",
      "exp": "An executive summary highlights core takeaways for senior leadership."
    },
    {
      "q": "Which greeting is best when sending a formal WhatsApp message to a prospective employer for the first time?",
      "opts": {
        "a": "Good morning [Name], I am contacting you regarding the [Job Title] role posted on Velaivaaipu.",
        "b": "Hey dude give me job please",
        "c": "Yo bro check my resume now",
        "d": "Call me immediately I need work"
      },
      "ans": "a",
      "exp": "Professional introductory messages state your identity, purpose, and context respectfully."
    },
    {
      "q": "What does non-defensive listening mean during a disagreement?",
      "opts": {
        "a": "Hearing the other person’s perspective without immediately reacting with excuses or anger",
        "b": "Wearing soundproof headphones so you do not hear criticism",
        "c": "Looking out of the window while someone is speaking",
        "d": "Calling a company lawyer into the room during every discussion"
      },
      "ans": "a",
      "exp": "Non-defensive listening opens the door to constructive problem-solving."
    },
    {
      "q": "What is an appropriate response when an interviewer asks, Do you have any questions for us?",
      "opts": {
        "a": "Yes, ask thoughtful questions about the team’s daily priorities, company culture, or role expectations.",
        "b": "No, I just want to leave and go home right now.",
        "c": "Ask when the company cafeteria serves lunch.",
        "d": "Ask how often employees can take unapproved leaves."
      },
      "ans": "a",
      "exp": "Asking insightful questions demonstrates genuine interest in the opportunity."
    },
    {
      "q": "What does the abbreviation TBD mean on a project schedule?",
      "opts": {
        "a": "To Be Decided / Determined",
        "b": "Total Business Deposit",
        "c": "Technical Bug Detected",
        "d": "Time Before Delivery"
      },
      "ans": "a",
      "exp": "TBD indicates that a specific detail or date has not yet been finalized."
    },
    {
      "q": "Why is it important to customize your resume for each specific job application?",
      "opts": {
        "a": "It highlights your most relevant skills and qualifications matching the specific job requirements",
        "b": "It changes your educational degree to whatever the employer wants",
        "c": "Applicant tracking systems automatically delete resumes that are sent twice",
        "d": "It decreases the file size of the PDF document"
      },
      "ans": "a",
      "exp": "Tailoring emphasizes experiences directly relevant to the target opening."
    },
    {
      "q": "What should you do if you realize you will be 10 minutes late for a scheduled job interview?",
      "opts": {
        "a": "Notify the interviewer proactively before the scheduled time with an apology and estimated arrival time",
        "b": "Arrive 10 minutes late and say nothing about it",
        "c": "Turn off your phone and pretend the interview was next week",
        "d": "Accuse the employer of scheduling the interview during heavy traffic hours"
      },
      "ans": "a",
      "exp": "Proactive communication shows respect for the interviewer’s valuable schedule."
    },
    {
      "q": "What does diplomacy mean in workplace conversations?",
      "opts": {
        "a": "Handling sensitive situations with tact, fairness, and care to avoid unnecessary offense",
        "b": "Signing peace treaties between international governments",
        "c": "Speaking only in whispered voices inside the office",
        "d": "Never answering any question directly under any circumstance"
      },
      "ans": "a",
      "exp": "Tact and diplomacy resolve workplace challenges without burning bridges."
    },
    {
      "q": "What is the role of Action Items at the conclusion of a meeting?",
      "opts": {
        "a": "Clear tasks assigned to specific individuals with designated target deadlines",
        "b": "A list of video games played during office lunch breaks",
        "c": "A list of chairs that need repair in the conference room",
        "d": "A document outlining employee dress code policies"
      },
      "ans": "a",
      "exp": "Action items ensure meeting discussions translate into concrete accountability."
    },
    {
      "q": "Which sentence is written in the active voice?",
      "opts": {
        "a": "The team completed the project on time.",
        "b": "The project was completed on time by the team.",
        "c": "On time was the project completed by the team.",
        "d": "A project completion was done by team members."
      },
      "ans": "a",
      "exp": "Active voice is direct and dynamic: the subject performs the action."
    },
    {
      "q": "Why is a professional LinkedIn summary important for jobseekers?",
      "opts": {
        "a": "It introduces your professional identity, core strengths, and career aspirations to recruiters",
        "b": "It determines your monthly internet data billing charges",
        "c": "It is required to download mobile applications from the App Store",
        "d": "It replaces all university graduation certificates"
      },
      "ans": "a",
      "exp": "A strong LinkedIn headline and summary capture recruiter attention in talent searches."
    }
  ],
  "computer-basics": [
    {
      "q": "What does 'RAM' stand for in computer hardware?",
      "opts": {
        "a": "Random Access Memory",
        "b": "Read Auto Mode",
        "c": "Rapid Allocation Module",
        "d": "Remote Access Network"
      },
      "ans": "a",
      "exp": "RAM is the fast temporary working memory used while running applications."
    },
    {
      "q": "What is the standard keyboard shortcut to copy selected text or files?",
      "opts": {
        "a": "Ctrl + C",
        "b": "Ctrl + V",
        "c": "Ctrl + X",
        "d": "Ctrl + Z"
      },
      "ans": "a",
      "exp": "Ctrl + C copies the selected item to the operating system clipboard."
    },
    {
      "q": "What keyboard shortcut pastes whatever was copied to the clipboard?",
      "opts": {
        "a": "Ctrl + V",
        "b": "Ctrl + P",
        "c": "Ctrl + B",
        "d": "Ctrl + A"
      },
      "ans": "a",
      "exp": "Ctrl + V pastes clipboard contents into the active location."
    },
    {
      "q": "What keyboard shortcut undoes your previous action in Windows?",
      "opts": {
        "a": "Ctrl + Z",
        "b": "Ctrl + Y",
        "c": "Ctrl + U",
        "d": "Ctrl + S"
      },
      "ans": "a",
      "exp": "Ctrl + Z undoes the most recent action."
    },
    {
      "q": "What does 'CPU' stand for in a computer system?",
      "opts": {
        "a": "Central Processing Unit",
        "b": "Central Power Utility",
        "c": "Computer Program Unit",
        "d": "Core Printer Universal"
      },
      "ans": "a",
      "exp": "The CPU is the central microprocessor executing computing instructions."
    },
    {
      "q": "Which of the following is an example of an Operating System?",
      "opts": {
        "a": "Microsoft Windows",
        "b": "Google Chrome",
        "c": "Adobe Photoshop",
        "d": "VLC Media Player"
      },
      "ans": "a",
      "exp": "Windows, macOS, and Linux are operating systems managing computer hardware and software."
    },
    {
      "q": "What does the keyboard shortcut 'Alt + Tab' do in Windows?",
      "opts": {
        "a": "Switches between currently open applications and windows",
        "b": "Shuts down the computer immediately",
        "c": "Permanently deletes the selected file",
        "d": "Opens the web camera"
      },
      "ans": "a",
      "exp": "Alt + Tab lets you quickly toggle between running programs."
    },
    {
      "q": "What is the file extension '.pdf' short for?",
      "opts": {
        "a": "Portable Document Format",
        "b": "Public Data File",
        "c": "Program Directory Folder",
        "d": "Printable Document File"
      },
      "ans": "a",
      "exp": "PDF stands for Portable Document Format, developed for universal document sharing."
    },
    {
      "q": "What does 'URL' stand for in web browsing?",
      "opts": {
        "a": "Uniform Resource Locator",
        "b": "Universal Register Link",
        "c": "United Resource Location",
        "d": "User Routing Line"
      },
      "ans": "a",
      "exp": "A URL is the address used to access a webpage on the internet."
    },
    {
      "q": "What is 'phishing' in cybersecurity?",
      "opts": {
        "a": "Fraudulent attempts to steal sensitive data (passwords, OTPs) by impersonating trusted entities",
        "b": "Connecting a high-speed fiber internet cable to a home router",
        "c": "Downloading licensed antivirus software from an official website",
        "d": "Cleaning dust from computer motherboard cooling fans"
      },
      "ans": "a",
      "exp": "Phishing uses deceptive emails, calls, or links to trick users into revealing credentials."
    },
    {
      "q": "What does a '.zip' file format indicate?",
      "opts": {
        "a": "A compressed archive containing one or more files reduced in size",
        "b": "A high-definition movie file that can only be played in theaters",
        "c": "A system audio recording of a telephone conversation",
        "d": "A corrupted file that must be deleted immediately"
      },
      "ans": "a",
      "exp": ".zip archives bundle and compress multiple files for easier sharing and storage."
    },
    {
      "q": "Which keyboard shortcut locks your Windows computer screen immediately?",
      "opts": {
        "a": "Windows Key + L",
        "b": "Windows Key + D",
        "c": "Ctrl + Alt + Enter",
        "d": "Shift + Esc"
      },
      "ans": "a",
      "exp": "Windows Key + L locks your workstation when stepping away from your desk."
    },
    {
      "q": "What is the primary difference between an SSD and an HDD for storage?",
      "opts": {
        "a": "SSDs use flash memory with no moving parts and are much faster than traditional spinning HDDs",
        "b": "HDDs cannot store photos while SSDs store only photos",
        "c": "SSDs can only be used on laptop computers, not desktops",
        "d": "HDDs never consume electrical power"
      },
      "ans": "a",
      "exp": "Solid State Drives (SSDs) are dramatically faster and more durable than magnetic HDDs."
    },
    {
      "q": "What does 'HTTP' stand for in web browser protocols?",
      "opts": {
        "a": "Hypertext Transfer Protocol",
        "b": "Hyperlink Testing Program",
        "c": "Host Timing Protocol",
        "d": "Hard Type Terminal Process"
      },
      "ans": "a",
      "exp": "HTTP is the foundation protocol for data communication over the World Wide Web."
    },
    {
      "q": "What does the 'S' in 'HTTPS' signify?",
      "opts": {
        "a": "Secure (encrypted via SSL/TLS)",
        "b": "Speedy (fast connection)",
        "c": "Standard",
        "d": "Synchronous"
      },
      "ans": "a",
      "exp": "HTTPS encrypts communication between the browser and website for security."
    },
    {
      "q": "Which of the following is considered an input device?",
      "opts": {
        "a": "Keyboard",
        "b": "Monitor",
        "c": "Printer",
        "d": "Speaker"
      },
      "ans": "a",
      "exp": "Keyboards, mice, and scanners feed data into the computer system."
    },
    {
      "q": "Which of the following is considered an output device?",
      "opts": {
        "a": "Monitor / Display Screen",
        "b": "Mouse",
        "c": "Microphone",
        "d": "Webcam"
      },
      "ans": "a",
      "exp": "Monitors, printers, and speakers display or deliver data from the computer."
    },
    {
      "q": "What is 'Cloud Storage' (like Google Drive, Microsoft OneDrive, or Dropbox)?",
      "opts": {
        "a": "Saving files on secure remote servers accessible via the internet from any device",
        "b": "Storing floppy disks inside an air-conditioned room",
        "c": "A weather forecasting application built into Windows 11",
        "d": "A computer hardware chip that operates without electricity"
      },
      "ans": "a",
      "exp": "Cloud storage lets you store, sync, and share files online across devices."
    },
    {
      "q": "What keyboard shortcut minimizes all open windows and displays the desktop in Windows?",
      "opts": {
        "a": "Windows Key + D",
        "b": "Ctrl + M",
        "c": "Alt + F4",
        "d": "Shift + Tab"
      },
      "ans": "a",
      "exp": "Windows Key + D toggles displaying the desktop."
    },
    {
      "q": "Why is it important to use strong, unique passwords for different work accounts?",
      "opts": {
        "a": "If one website suffers a data breach, your other accounts remain safe and protected",
        "b": "Computers run faster when passwords contain special characters",
        "c": "It is required to keep computer cooling fans quiet",
        "d": "Browsers charge monthly fees for simple passwords"
      },
      "ans": "a",
      "exp": "Unique passwords prevent credential stuffing attacks across different websites."
    },
    {
      "q": "What does the keyboard shortcut 'Ctrl + Shift + Esc' do in Windows?",
      "opts": {
        "a": "Opens the Task Manager directly",
        "b": "Turns off the computer display monitor",
        "c": "Closes the current browser tab",
        "d": "Restarts the broadband router"
      },
      "ans": "a",
      "exp": "Ctrl + Shift + Esc opens Windows Task Manager immediately to manage running processes."
    },
    {
      "q": "What is an 'IP Address' in computer networks?",
      "opts": {
        "a": "A unique numerical identifier assigned to each device connected to a network",
        "b": "The physical postal address of an internet provider's office",
        "c": "The serial number printed on a computer motherboard",
        "d": "A password used to sign in to Windows"
      },
      "ans": "a",
      "exp": "An Internet Protocol (IP) address identifies devices communicating across networks."
    },
    {
      "q": "What does 'cache' mean in web browser settings?",
      "opts": {
        "a": "Temporary storage of web page assets (images, stylesheets) to speed up future loading",
        "b": "A folder where deleted files are stored for 30 days",
        "c": "An online wallet used to pay for subscription software",
        "d": "A computer virus that corrupts desktop shortcuts"
      },
      "ans": "a",
      "exp": "Browser cache saves static files locally to load visited websites faster on repeat visits."
    },
    {
      "q": "What is 'malware'?",
      "opts": {
        "a": "Malicious software designed to disrupt, damage, or gain unauthorized access to computer systems",
        "b": "Software manufactured specifically for male executives",
        "c": "Free open-source office editing applications",
        "d": "A hardware cable used to connect monitors"
      },
      "ans": "a",
      "exp": "Malware includes viruses, worms, spyware, and ransomware that harm digital systems."
    },
    {
      "q": "Which key on the keyboard refreshes the current active webpage in most browsers?",
      "opts": {
        "a": "F5 (or Ctrl + R)",
        "b": "F1",
        "c": "F11",
        "d": "F12"
      },
      "ans": "a",
      "exp": "F5 or Ctrl + R reloads the current page in modern web browsers."
    },
    {
      "q": "What is 'Two-Factor Authentication' (2FA)?",
      "opts": {
        "a": "A security process requiring two distinct forms of identification before granting access (e.g. password + OTP)",
        "b": "Typing your password twice in capital letters",
        "c": "Having two people type on the keyboard at the same time",
        "d": "Using two computer monitors simultaneously"
      },
      "ans": "a",
      "exp": "2FA significantly enhances security by combining something you know with something you have."
    },
    {
      "q": "What is the primary function of an Antivirus program?",
      "opts": {
        "a": "Detecting, quarantining, and removing harmful malicious code from your computer",
        "b": "Cleaning physical fingerprints from computer touchscreens",
        "c": "Increasing internet download bandwidth speeds automatically",
        "d": "Printing documents without using paper"
      },
      "ans": "a",
      "exp": "Antivirus software monitors system files to prevent and neutralize security threats."
    },
    {
      "q": "What does a '.csv' file format represent?",
      "opts": {
        "a": "Comma-Separated Values (plain text tabular data)",
        "b": "Computer System Video",
        "c": "Compressed Script Vector",
        "d": "Cyber Security Verification"
      },
      "ans": "a",
      "exp": "CSV files store spreadsheet data as plain text separated by commas."
    },
    {
      "q": "What should you do if an unknown email attachment arrives with the extension '.exe' from an unknown sender?",
      "opts": {
        "a": "Do not open it; report or delete it as it may contain malicious executable code",
        "b": "Double click it immediately to see what happens",
        "c": "Forward it to all your office colleagues",
        "d": "Rename it to a PDF file"
      },
      "ans": "a",
      "exp": "Executable (.exe) files from strangers are high-risk vectors for malware installation."
    },
    {
      "q": "What does 'DNS' stand for in internet infrastructure?",
      "opts": {
        "a": "Domain Name System",
        "b": "Digital Network Standard",
        "c": "Direct Network Storage",
        "d": "Data Number Sequence"
      },
      "ans": "a",
      "exp": "DNS translates human-readable domain names (velaivaaipu.in) into machine IP addresses."
    },
    {
      "q": "What does GUI stand for in computer software?",
      "opts": {
        "a": "Graphical User Interface",
        "b": "General Utility Index",
        "c": "Global User Identification",
        "d": "Graphic Unified Integration"
      },
      "ans": "a",
      "exp": "GUI allows users to interact with visual icons rather than typing terminal text commands."
    },
    {
      "q": "What keyboard shortcut opens a new tab in Google Chrome or Microsoft Edge?",
      "opts": {
        "a": "Ctrl + T",
        "b": "Ctrl + N",
        "c": "Ctrl + W",
        "d": "Ctrl + J"
      },
      "ans": "a",
      "exp": "Ctrl + T opens a fresh tab in all modern web browsers."
    },
    {
      "q": "What keyboard shortcut closes the current tab in web browsers?",
      "opts": {
        "a": "Ctrl + W",
        "b": "Ctrl + Q",
        "c": "Ctrl + E",
        "d": "Ctrl + R"
      },
      "ans": "a",
      "exp": "Ctrl + W closes the current tab quickly."
    },
    {
      "q": "What keyboard shortcut opens an incognito (private browsing) window in Google Chrome?",
      "opts": {
        "a": "Ctrl + Shift + N",
        "b": "Ctrl + Shift + P",
        "c": "Ctrl + Alt + I",
        "d": "Ctrl + Shift + W"
      },
      "ans": "a",
      "exp": "Ctrl + Shift + N opens an incognito window in Chrome."
    },
    {
      "q": "What is a device driver in computer systems?",
      "opts": {
        "a": "Software that allows the operating system to communicate with hardware (like printers or audio cards)",
        "b": "A chauffeur who drives company delivery vehicles",
        "c": "A USB flash drive used for storing presentation slides",
        "d": "A cooling fan that prevents laptop batteries from overheating"
      },
      "ans": "a",
      "exp": "Drivers bridge hardware peripherals with operating system commands."
    },
    {
      "q": "What does LAN stand for in networking?",
      "opts": {
        "a": "Local Area Network",
        "b": "Large Access Node",
        "c": "Line Allocation Network",
        "d": "Logic Automation Number"
      },
      "ans": "a",
      "exp": "A LAN connects computers within a limited physical area, like an office or building."
    },
    {
      "q": "What does WAN stand for in networking?",
      "opts": {
        "a": "Wide Area Network",
        "b": "Wireless Access Name",
        "c": "Web Allocation Network",
        "d": "World Automation Node"
      },
      "ans": "a",
      "exp": "A WAN connects computers across broad geographic regions (the internet is the largest WAN)."
    },
    {
      "q": "What is the function of a computer router?",
      "opts": {
        "a": "Directing data packets between computer networks and connecting local devices to the internet",
        "b": "Printing invoices on carbon copy paper",
        "c": "Cooling the microprocessor chip with liquid nitrogen",
        "d": "Recording audio during telephone calls"
      },
      "ans": "a",
      "exp": "Routers route data traffic between local home/office networks and external internet servers."
    },
    {
      "q": "What does VPN stand for in internet privacy?",
      "opts": {
        "a": "Virtual Private Network",
        "b": "Verified Public Network",
        "c": "Visual Processing Node",
        "d": "Virtual Protocol Number"
      },
      "ans": "a",
      "exp": "A VPN creates an encrypted tunnel for secure, private data transmission over the internet."
    },
    {
      "q": "What does the keyboard shortcut Ctrl + F do in most software programs?",
      "opts": {
        "a": "Opens a search box to find specific words or phrases on the page",
        "b": "Formats the computer hard drive",
        "c": "Fills the screen with full brightness",
        "d": "Forwards the current document to all email contacts"
      },
      "ans": "a",
      "exp": "Ctrl + F opens the Find dialog across browsers, documents, and spreadsheets."
    },
    {
      "q": "What is the purpose of the Recycle Bin (or Trash) on an operating system?",
      "opts": {
        "a": "Holding deleted files temporarily so they can be restored if removed by accident",
        "b": "Recycling physical computer plastic components",
        "c": "Converting Word documents into Excel files",
        "d": "Saving battery power when running low on charge"
      },
      "ans": "a",
      "exp": "The Recycle Bin allows accidental deletions to be restored before permanent emptying."
    },
    {
      "q": "What is an SSID in Wi-Fi networking?",
      "opts": {
        "a": "The visible broadcast name of a wireless Wi-Fi network",
        "b": "The secret master password of a broadband router",
        "c": "The physical serial number of an Ethernet cable",
        "d": "The speed of download measured in megabits per second"
      },
      "ans": "a",
      "exp": "Service Set Identifier (SSID) is the name displayed when searching for Wi-Fi networks."
    },
    {
      "q": "What does PDF stand for in digital documents?",
      "opts": {
        "a": "Portable Document Format",
        "b": "Public Data Folder",
        "c": "Program Directory File",
        "d": "Printable Data Form"
      },
      "ans": "a",
      "exp": "PDF preserves document formatting across all operating systems and devices."
    },
    {
      "q": "What keyboard shortcut captures a rectangular screenshot in modern Windows 10/11?",
      "opts": {
        "a": "Windows Key + Shift + S",
        "b": "Ctrl + Alt + Del",
        "c": "Windows Key + R",
        "d": "Shift + Space + Enter"
      },
      "ans": "a",
      "exp": "Windows Key + Shift + S launches the Snipping Tool for targeted screenshots."
    },
    {
      "q": "What is ransomware in cybersecurity threats?",
      "opts": {
        "a": "Malware that encrypts your files and demands payment to restore access",
        "b": "Free software provided by educational charities",
        "c": "A computer hardware part that needs monthly replacement",
        "d": "An antivirus program certified by the government"
      },
      "ans": "a",
      "exp": "Ransomware locks user files until an extortion fee is paid."
    },
    {
      "q": "What does USB stand for in computer hardware connectors?",
      "opts": {
        "a": "Universal Serial Bus",
        "b": "Unified Storage Backup",
        "c": "Universal System Battery",
        "d": "Unit Synchronization Block"
      },
      "ans": "a",
      "exp": "USB is the industry standard connector for data transfer and device power."
    },
    {
      "q": "What is the purpose of a browser cookie?",
      "opts": {
        "a": "A small data file stored by websites to remember login status, preferences, and cart items",
        "b": "A sweet snack served in software developer cafeterias",
        "c": "A virus that deletes browser bookmarks after two days",
        "d": "A hardware component installed inside keyboard spacebars"
      },
      "ans": "a",
      "exp": "Cookies store user session tokens and personalized browsing preferences."
    },
    {
      "q": "What does HTML stand for in web development?",
      "opts": {
        "a": "HyperText Markup Language",
        "b": "High Transfer Machine Logic",
        "c": "Hyperlink Text Management List",
        "d": "Home Terminal Module Layout"
      },
      "ans": "a",
      "exp": "HTML is the standard markup language used to structure web pages."
    },
    {
      "q": "What is an Ethernet cable (RJ-45) used for?",
      "opts": {
        "a": "Connecting computers directly to a router or network switch with high-speed wired internet",
        "b": "Connecting a television antenna to a roof pole",
        "c": "Charging smartphone batteries in automobiles",
        "d": "Plugging headphones into sound cards"
      },
      "ans": "a",
      "exp": "Ethernet cables provide fast, stable, and low-latency wired network connections."
    },
    {
      "q": "What does OS stand for in computer science?",
      "opts": {
        "a": "Operating System",
        "b": "Online Storage",
        "c": "Open Source",
        "d": "Optical Sensor"
      },
      "ans": "a",
      "exp": "The Operating System manages hardware resources and provides user interface environments."
    }
  ],
  "customer-service": [
    {
      "q": "When a customer is visibly upset or angry, what is the best first step?",
      "opts": {
        "a": "Listen calmly without interrupting, acknowledge their frustration, and show empathy",
        "b": "Tell them to calm down immediately or you will hang up",
        "c": "Argue and explain how the customer caused their own problem",
        "d": "Place them on hold for twenty minutes until they stop shouting"
      },
      "ans": "a",
      "exp": "Active listening and acknowledging feelings de-escalates customer tension effectively."
    },
    {
      "q": "What does 'FCR' stand for in customer support operations?",
      "opts": {
        "a": "First Contact Resolution",
        "b": "Final Customer Refund",
        "c": "Fast Call Routing",
        "d": "Frequent Customer Return"
      },
      "ans": "a",
      "exp": "First Contact Resolution measures resolving issues on the customer's initial interaction."
    },
    {
      "q": "What does 'SLA' stand for in service support commitments?",
      "opts": {
        "a": "Service Level Agreement",
        "b": "Standard Legal Action",
        "c": "System Login Access",
        "d": "Sales Lead Assignment"
      },
      "ans": "a",
      "exp": "A Service Level Agreement specifies agreed response and resolution deadlines."
    },
    {
      "q": "Which response demonstrates positive phrasing when a product is temporarily out of stock?",
      "opts": {
        "a": "\"That product will be back in stock next Tuesday. May I reserve one for you or notify you the moment it arrives?\"",
        "b": "\"We don't have it. It's completely finished.\"",
        "c": "\"You should have ordered it last month before it got sold out.\"",
        "d": "\"I don't know when the warehouse will wake up and send items.\""
      },
      "ans": "a",
      "exp": "Positive phrasing focuses on solutions, availability dates, and proactive help."
    },
    {
      "q": "What should you do before placing a caller on hold?",
      "opts": {
        "a": "Ask for their permission, explain why you need to place them on hold, and provide an expected duration",
        "b": "Press the hold button instantly without warning",
        "c": "Mute your microphone and talk to colleagues about private weekend plans",
        "d": "Disconnect the phone line and pretend the network failed"
      },
      "ans": "a",
      "exp": "Polite customer care asks permission and sets time expectations before holding."
    },
    {
      "q": "What is an effective way to handle a question when you do not immediately know the answer?",
      "opts": {
        "a": "\"That is an important question. Please give me a moment to consult with our technical team so I can give you the exact details.\"",
        "b": "\"I have no idea, nobody told me anything about that.\"",
        "c": "\"Guess an answer and hope the customer doesn't verify it.\"",
        "d": "\"Tell the customer that feature does not exist.\""
      },
      "ans": "a",
      "exp": "Transparently committing to verify accurate information instills customer trust."
    },
    {
      "q": "What does 'CSAT' stand for in customer feedback metrics?",
      "opts": {
        "a": "Customer Satisfaction (Score)",
        "b": "Customer Sales Acquisition Target",
        "c": "Company Service Audit Test",
        "d": "Centralized Support Access Terminal"
      },
      "ans": "a",
      "exp": "CSAT measures how satisfied customers are with a specific service or interaction."
    },
    {
      "q": "What is a 'Ticket' in helpdesk management software?",
      "opts": {
        "a": "A documented case record tracking a customer's inquiry or issue through to resolution",
        "b": "A cinema pass given to customers as a promotional prize",
        "c": "A parking receipt issued outside a company corporate office",
        "d": "A printed warning notice issued for employee late attendance"
      },
      "ans": "a",
      "exp": "Helpdesk tickets track inquiry details, status, ownership, and resolution history."
    },
    {
      "q": "Why is following up with a customer after resolving their ticket important?",
      "opts": {
        "a": "It confirms the solution worked and demonstrates that your company values their satisfaction",
        "b": "It resets the support agent's monthly sales commission quota",
        "c": "It is required to stop the customer from using your competitor's product",
        "d": "It automatically increases the customer's credit card limit"
      },
      "ans": "a",
      "exp": "Follow-ups confirm lasting satisfaction and build strong customer retention."
    },
    {
      "q": "What does 'NPS' stand for in customer experience measurement?",
      "opts": {
        "a": "Net Promoter Score",
        "b": "New Product Sales",
        "c": "Network Performance Standard",
        "d": "National Postal Service"
      },
      "ans": "a",
      "exp": "Net Promoter Score measures customer loyalty and willingness to recommend your brand."
    },
    {
      "q": "What does 'de-escalation' mean in customer support?",
      "opts": {
        "a": "Techniques used to reduce emotional intensity and return a conflict to calm, constructive dialogue",
        "b": "Transferring an angry caller to three different departments in a circle",
        "c": "Hanging up the phone whenever a customer raises their voice",
        "d": "Offering a 90% discount on every purchase without supervisor approval"
      },
      "ans": "a",
      "exp": "De-escalation diffuses anger through calm tone, empathy, and constructive problem-solving."
    },
    {
      "q": "Which of the following is considered an omnichannel customer support experience?",
      "opts": {
        "a": "Providing seamless, integrated support across email, chat, WhatsApp, phone, and in-person channels",
        "b": "Supporting customers exclusively through printed postal postcards",
        "c": "Opening a support center that only operates on Sunday mornings",
        "d": "Answering support questions using automated AI robots without human review"
      },
      "ans": "a",
      "exp": "Omnichannel support connects multiple communication touchpoints into a unified customer journey."
    },
    {
      "q": "What should you always do before closing a customer support interaction?",
      "opts": {
        "a": "Ask if there is anything else you can assist with, and thank them warmly for contacting your company",
        "b": "Immediately end the call the second the main problem is solved",
        "c": "Ask the customer to send money to your personal UPI ID",
        "d": "Demand that they leave a five-star review before you let them disconnect"
      },
      "ans": "a",
      "exp": "Checking for additional questions and expressing gratitude ensures thorough service."
    },
    {
      "q": "How should support agents handle sensitive customer personal information (passwords, OTPs)?",
      "opts": {
        "a": "Never ask for or store passwords or OTPs; maintain strict confidentiality at all times",
        "b": "Write passwords on sticky notes and paste them on computer monitors",
        "c": "Share customer phone numbers in public WhatsApp group chats",
        "d": "Save passwords in plain text on unencrypted personal pen drives"
      },
      "ans": "a",
      "exp": "Security integrity and customer privacy must be strictly protected under data privacy laws."
    },
    {
      "q": "What does 'CRM' stand for in sales and support management?",
      "opts": {
        "a": "Customer Relationship Management",
        "b": "Central Revenue Module",
        "c": "Client Retention Method",
        "d": "Company Resource Monitor"
      },
      "ans": "a",
      "exp": "CRM systems store customer data, communication histories, and interaction notes."
    },
    {
      "q": "What is an effective response when a customer requests a feature that your company does not currently offer?",
      "opts": {
        "a": "\"Thank you for that suggestion. While we don't have that feature today, I will log your feedback directly with our product team.\"",
        "b": "\"That is a ridiculous idea and we will never build it.\"",
        "c": "\"Go buy our competitor's software if you need that.\"",
        "d": "\"Lie and promise the feature will be ready tomorrow morning.\""
      },
      "ans": "a",
      "exp": "Acknowledging feedback and logging it with product teams turns missing features into goodwill."
    },
    {
      "q": "What does the 'L.A.S.T.' customer complaint resolution framework stand for?",
      "opts": {
        "a": "Listen, Apologize, Solve, Thank",
        "b": "Leave, Argue, Shout, Threaten",
        "c": "Log, Audit, Subtract, Terminate",
        "d": "Lookup, Answer, Search, Transfer"
      },
      "ans": "a",
      "exp": "L.A.S.T. (Listen, Apologize, Solve, Thank) is a proven complaint resolution framework."
    },
    {
      "q": "What is 'customer retention'?",
      "opts": {
        "a": "The ability of a company to turn customers into repeat buyers and prevent them from leaving",
        "b": "Refusing to allow customers to cancel their subscriptions under any circumstance",
        "c": "Holding a customer's physical belongings in an office safe",
        "d": "The total number of new employees retained after probation"
      },
      "ans": "a",
      "exp": "Retention measures how effectively a company keeps existing customers satisfied over time."
    },
    {
      "q": "Why is taking clear, concise internal notes on a customer's ticket important?",
      "opts": {
        "a": "So any colleague who handles the case next understands the context without asking the customer to repeat themselves",
        "b": "To keep the computer keyboard from getting dusty during quiet hours",
        "c": "To fulfill weekly typing speed quotas mandated by the human resources team",
        "d": "Notes are legally published in daily newspapers across the state"
      },
      "ans": "a",
      "exp": "Thorough ticket notes prevent customers from frustratingly repeating their story to multiple agents."
    },
    {
      "q": "What does 'tone matching' mean in written customer support chats?",
      "opts": {
        "a": "Adapting your conversational style to be appropriately professional, empathetic, or concise based on the customer's state",
        "b": "Copying and pasting the customer's exact words back to them word for word",
        "c": "Matching the text font color to the color of the customer's profile picture",
        "d": "Singing customer support responses over a telephone headset"
      },
      "ans": "a",
      "exp": "Calibrating tone ensures messages feel respectful, helpful, and emotionally attuned."
    },
    {
      "q": "What is Active Listening in phone customer support?",
      "opts": {
        "a": "Listening attentively, taking notes, and verifying understanding before answering",
        "b": "Multitasking on social media while a caller explains their issue",
        "c": "Speaking over the caller whenever you think you know the answer",
        "d": "Transferring the call to an automated voice menu"
      },
      "ans": "a",
      "exp": "Active listening focuses fully on what the customer is saying before offering solutions."
    },
    {
      "q": "What is the recommended maximum time a customer should be left on hold without an agent check-in?",
      "opts": {
        "a": "1 to 2 minutes",
        "b": "15 to 20 minutes",
        "c": "One full hour",
        "d": "Until the customer hangs up"
      },
      "ans": "a",
      "exp": "Checking in every 60-90 seconds reassures the customer that their issue is being actively worked on."
    },
    {
      "q": "What does escalating a ticket mean in customer support operations?",
      "opts": {
        "a": "Transferring an unresolved or complex case to a senior specialist or manager",
        "b": "Deleting the ticket from the database to lower open case counts",
        "c": "Filing a police report against a complaining customer",
        "d": "Charging the customer double for telephone support"
      },
      "ans": "a",
      "exp": "Escalations route tricky issues to appropriate teams with higher technical or policy authority."
    },
    {
      "q": "What is a Knowledge Base in customer service portals?",
      "opts": {
        "a": "A self-service library of FAQs, tutorials, and troubleshooting articles for users",
        "b": "A private employee salary database",
        "c": "A file cabinet containing paper receipt slips",
        "d": "A social media feed of office birthday celebrations"
      },
      "ans": "a",
      "exp": "Knowledge bases empower customers to resolve routine questions quickly on their own."
    },
    {
      "q": "What is an empathy statement in support communications?",
      "opts": {
        "a": "I completely understand how frustrating this delay must be, and I am here to help you resolve it.",
        "b": "That is not my problem, contact another department.",
        "c": "Our company policy says you are wrong.",
        "d": "Why are you calling about such a small matter?"
      },
      "ans": "a",
      "exp": "Empathy statements validate customer feelings and signal cooperative partnership."
    },
    {
      "q": "What does AHT stand for in call center management?",
      "opts": {
        "a": "Average Handle Time",
        "b": "Account Holder Tariff",
        "c": "Annual Help Target",
        "d": "Auto Hangup Timing"
      },
      "ans": "a",
      "exp": "AHT measures the average total duration of a customer call, including hold and wrap-up."
    },
    {
      "q": "What should an agent do if a customer asks for a service policy exception they are not authorized to grant?",
      "opts": {
        "a": "Politely explain the guideline, research approved alternatives, or consult a supervisor for guidance",
        "b": "Promise the exception anyway and leave work for the day",
        "c": "Rudely laugh at the customer for asking",
        "d": "Hang up the phone immediately"
      },
      "ans": "a",
      "exp": "Honesty combined with consultative guidance maintains credibility without violating policy."
    },
    {
      "q": "What is a warm transfer in telephone customer support?",
      "opts": {
        "a": "Introducing the customer and their issue to the receiving agent before disconnecting from the line",
        "b": "Putting the telephone handset under a warm desk lamp",
        "c": "Transferring a caller to a dead line with no answer",
        "d": "Leaving a customer on music hold for half an hour"
      },
      "ans": "a",
      "exp": "Warm transfers brief the colleague so the customer does not have to repeat their story."
    },
    {
      "q": "Why is asking for customer feedback through post-service surveys beneficial?",
      "opts": {
        "a": "It identifies operational bottlenecks, training gaps, and opportunities to improve services",
        "b": "It forces unhappy customers to change their minds",
        "c": "It automatically generates tax write-offs for the company",
        "d": "It is required to keep call center telephone licenses active"
      },
      "ans": "a",
      "exp": "Continuous feedback fuels service quality enhancements and customer loyalty."
    },
    {
      "q": "What does rapport building mean in customer conversations?",
      "opts": {
        "a": "Establishing a comfortable, friendly, and respectful interpersonal connection with the customer",
        "b": "Giving customers free corporate office stationery items",
        "c": "Agreeing to break company rules for friends",
        "d": "Calling customers late at night on personal numbers"
      },
      "ans": "a",
      "exp": "Rapport creates a collaborative environment where problems can be solved smoothly."
    },
    {
      "q": "What does First Response Time (FRT) measure in support helpdesks?",
      "opts": {
        "a": "The time elapsed between a customer submitting a ticket and receiving their first human response",
        "b": "The time it takes a computer monitor to turn on in the morning",
        "c": "The total duration of an employee’s lunch break",
        "d": "How quickly an automated bot sends an acknowledgment email"
      },
      "ans": "a",
      "exp": "FRT measures responsiveness to incoming customer inquiries."
    },
    {
      "q": "How should an agent handle an abusive or profanity-laced customer call?",
      "opts": {
        "a": "Remain calm, set a polite boundary against abusive language, and follow company de-escalation/disconnection protocols",
        "b": "Shout louder and curse back at the caller",
        "c": "Forward the caller’s phone number to friends to harass them",
        "d": "Post the recorded audio on public social media sites"
      },
      "ans": "a",
      "exp": "Professional boundaries maintain composure while following official policy on abusive callers."
    },
    {
      "q": "What is Customer Lifetime Value (CLV)?",
      "opts": {
        "a": "The total revenue a business can reasonably expect from a single customer account throughout their relationship",
        "b": "The average age of registered customers in years",
        "c": "The amount of cash inside a company bank account",
        "d": "The physical duration a customer spends inside a store"
      },
      "ans": "a",
      "exp": "CLV emphasizes the long-term strategic importance of retaining happy clients."
    },
    {
      "q": "What does closing the loop mean with an unhappy customer?",
      "opts": {
        "a": "Following up after a problem is resolved to ensure they are fully satisfied with the outcome",
        "b": "Blocking their phone number so they cannot call back",
        "c": "Deleting their customer account permanently",
        "d": "Sending them an automated bill with additional penalty fees"
      },
      "ans": "a",
      "exp": "Closing the loop confirms resolution success and restores customer goodwill."
    },
    {
      "q": "What is a canned response or macro in customer support tools?",
      "opts": {
        "a": "A pre-written template for common questions that agents can personalize and send quickly",
        "b": "An expired tin of food stored in an office kitchen",
        "c": "A computer virus that sends spam emails to all contacts",
        "d": "A legal summons sent by a municipal consumer court"
      },
      "ans": "a",
      "exp": "Macros speed up accurate responses to frequent inquiries while maintaining consistency."
    },
    {
      "q": "What does active ownership of a customer problem mean?",
      "opts": {
        "a": "Taking personal responsibility to see the customer’s issue through to a satisfactory resolution",
        "b": "Blaming the shipping company whenever a package is delayed",
        "c": "Telling the customer that software bugs are not your fault",
        "d": "Forwarding every email to your manager without reading it"
      },
      "ans": "a",
      "exp": "Ownership builds deep customer trust by guaranteeing someone is accountable for the fix."
    },
    {
      "q": "What is an example of an open-ended discovery question in technical support?",
      "opts": {
        "a": "Could you walk me through the steps that led up to this error message?",
        "b": "Is it working? Yes or no?",
        "c": "Did you break it?",
        "d": "Are you using a computer?"
      },
      "ans": "a",
      "exp": "Open-ended discovery questions gather critical context without leading the customer."
    },
    {
      "q": "What does churn represent in software and subscription businesses?",
      "opts": {
        "a": "The rate at which subscribers cancel or choose not to renew their accounts",
        "b": "The speed at which support agents type on keyboards",
        "c": "The quantity of coffee consumed in office breakrooms",
        "d": "The number of new features released every quarter"
      },
      "ans": "a",
      "exp": "High churn indicates retention issues that customer service teams work hard to mitigate."
    },
    {
      "q": "Why is clarity and simplicity more effective than technical jargon when assisting everyday users?",
      "opts": {
        "a": "It prevents confusion and makes troubleshooting steps easy and stress-free for the customer to follow",
        "b": "Technical terms consume twice as much network bandwidth",
        "c": "Company management bans the use of words longer than six letters",
        "d": "It decreases the physical temperature of the computer"
      },
      "ans": "a",
      "exp": "Plain, helpful instructions build customer confidence and solve issues faster."
    },
    {
      "q": "What is the best way to deliver an estimated resolution time to a customer?",
      "opts": {
        "a": "Give a realistic, honest timeframe with a commitment to update them if unexpected delays occur",
        "b": "Promise it will take two minutes when you know it will take two days",
        "c": "Refuse to provide any timeframe under any condition",
        "d": "Guarantee an instant fix without understanding the problem"
      },
      "ans": "a",
      "exp": "Setting realistic expectations and communicating proactively prevents customer frustration."
    },
    {
      "q": "What does Customer Effort Score (CES) evaluate?",
      "opts": {
        "a": "How easy or difficult it was for a customer to get their problem solved by the company",
        "b": "The physical weight of items lifted by customer service staff",
        "c": "How many miles a customer walked to reach a physical retail shop",
        "d": "How much money a customer spent on their credit card"
      },
      "ans": "a",
      "exp": "Low effort experiences drive strong loyalty and repeat business."
    },
    {
      "q": "What is the role of an automated IVR (Interactive Voice Response) system?",
      "opts": {
        "a": "Greeting callers and routing them to the correct department using dial pad selections",
        "b": "Automatically disconnecting callers after 30 seconds",
        "c": "Selling unwanted products to calling customers",
        "d": "Recording unauthorized personal conversations"
      },
      "ans": "a",
      "exp": "IVRs direct callers efficiently to specialists equipped to handle their exact issue."
    },
    {
      "q": "What does de-escalation through apology look like when a genuine company error happened?",
      "opts": {
        "a": "We sincerely apologize for this mistake. Let us make this right immediately by taking these exact steps...",
        "b": "Mistakes happen to everyone, so you should not make a big deal out of it.",
        "c": "Our computer system had a glitch, so nobody is to blame.",
        "d": "If you do not like our service, you can go somewhere else."
      },
      "ans": "a",
      "exp": "A genuine, non-defensive apology combined with an action plan de-escalates anger."
    },
    {
      "q": "What is an SLA breach?",
      "opts": {
        "a": "Failing to respond to or resolve a customer inquiry within the agreed target timeframe",
        "b": "A customer forgetting their login password",
        "c": "A physical break-in at an office headquarters building",
        "d": "An employee resigning from their position with prior notice"
      },
      "ans": "a",
      "exp": "SLA breaches signal missed performance commitments that require operational attention."
    },
    {
      "q": "Why should customer service agents avoid eating or chewing gum while on a live support phone call?",
      "opts": {
        "a": "It impairs speech clarity and sounds unprofessional and disrespectful to the caller",
        "b": "Chewing gum damages computer headset microphone wiring",
        "c": "It is against municipal labor workplace laws",
        "d": "It causes internet Wi-Fi connections to disconnect"
      },
      "ans": "a",
      "exp": "Clear enunciation and professional conduct are fundamental in voice interactions."
    },
    {
      "q": "What is a proactive customer service example?",
      "opts": {
        "a": "Notifying a customer about a scheduled system maintenance window before their service is impacted",
        "b": "Waiting for a customer to complain five times before answering",
        "c": "Calling customers at 2:00 AM to ask how their day went",
        "d": "Canceling orders without explaining why"
      },
      "ans": "a",
      "exp": "Proactive support anticipates needs and resolves friction before customers experience it."
    },
    {
      "q": "What does active listening through reflection mean?",
      "opts": {
        "a": "Reflecting the customer’s key words back to them to validate you heard them accurately",
        "b": "Holding a physical mirror in front of your face during phone calls",
        "c": "Reading your own email out loud three times before sending",
        "d": "Repeating everything backwards"
      },
      "ans": "a",
      "exp": "Reflecting ensures both parties are aligned on the core problem statement."
    },
    {
      "q": "What should an agent do when they promise to call a customer back at 3:00 PM, but the investigation is not yet complete by 3:00 PM?",
      "opts": {
        "a": "Call at 3:00 PM anyway, update the customer on progress, and provide the next checkpoint time",
        "b": "Do not call until the investigation is finished next week",
        "c": "Call at midnight when the customer is sleeping",
        "d": "Pretend the promise was never made"
      },
      "ans": "a",
      "exp": "Honoring communication commitments builds immense reliability and trust."
    },
    {
      "q": "What is the foundation of excellent customer service in entry-level retail and office roles?",
      "opts": {
        "a": "Patience, attentiveness, respectful communication, and a sincere desire to be helpful",
        "b": "Memorizing thousands of technical computer programming manuals",
        "c": "Speaking three foreign languages fluently",
        "d": "Refusing to speak with customers who do not hold corporate titles"
      },
      "ans": "a",
      "exp": "Empathy, clear communication, and helpfulness define outstanding customer service."
    },
    {
      "q": "What is the final phrase an agent should use to leave a positive lasting impression before saying goodbye?",
      "opts": {
        "a": "Thank you for choosing Velaivaaipu! Please let us know if you need anything else, and have a wonderful day!",
        "b": "Okay I am hanging up now bye.",
        "c": "Do not call back today we are busy.",
        "d": "Whatever you say."
      },
      "ans": "a",
      "exp": "A warm, professional closing leaves customers feeling valued and respected."
    }
  ]
};

// Returns a normalized set of 10 questions for a category
const getCuratedSet = (categoryKey, setIndex = 0) => {
  const pool = BANK[categoryKey];
  if (!pool || pool.length < QUESTIONS_PER_SET) return null;

  const start = (setIndex * QUESTIONS_PER_SET) % pool.length;
  let slice = pool.slice(start, start + QUESTIONS_PER_SET);
  if (slice.length < QUESTIONS_PER_SET) {
    slice = slice.concat(pool.slice(0, QUESTIONS_PER_SET - slice.length));
  }

  const raw = slice.map((item, idx) => ({
    id: idx + 1,
    question: item.q,
    options: item.opts,
    correct_option: item.ans,
    explanation: item.exp
  }));

  return normalizeSet(raw);
};

module.exports = { BANK, getCuratedSet };
