export interface IndustryVertical {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  headline: string;
  subheadline: string;
  badge: string;
  painPoints: {
    title: string;
    description: string;
    remedy: string;
  }[];
  keyFeatures: {
    title: string;
    description: string;
    benefit: string;
  }[];
  hardwareAdvice: {
    category: string;
    recommendation: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export const INDUSTRY_VERTICALS: Record<string, IndustryVertical> = {
  "kirana-store": {
    slug: "kirana-store",
    name: "Kirana & Provision Stores",
    shortName: "Kirana Store",
    tagline: "High-speed barcode billing & digital customer udhar khata for daily groceries.",
    metaTitle: "Best Kirana Store Billing Software & Udhar Khata App | MiniHisab",
    metaDescription: "Speed up evening rush checkout with 0.8s barcode scanning, loose items weighing, digital customer khata ledgers, and 80mm thermal receipts.",
    keywords: [
      "billing software for kirana store",
      "kirana shop billing software",
      "grocery pos billing software",
      "kirana udhar khata app",
      "kirana thermal printer software",
    ],
    badge: "Built for Kirana & Provision Shops",
    headline: "Fast counter billing & digital udhar khata for your kirana store.",
    subheadline:
      "Eliminate evening counter chaos. Scan packaged items in under a second, punch loose pulses or spices with one touch, and track customer credit without messy red paper diaries.",
    painPoints: [
      {
        title: "Long lines during 7 PM to 10 PM rush hours",
        description:
          "Manual calculation and slow computer typing frustrate hurried neighborhood shoppers and lead to calculation mistakes.",
        remedy:
          "Sub-second barcode auto-detection and custom hotkeys for common daily items (milk, bread, oil) let cashiers clear queues effortlessly.",
      },
      {
        title: "Lost money in untracked customer credit (Udhar)",
        description:
          "Maintaining customer credit in paper khata notebooks causes lost pages, forgotten balances, and awkward disputes when settling dues.",
        remedy:
          "Search customer by phone or name, see running balance instantly, set custom credit limits, and accept partial payments with digital receipts.",
      },
      {
        title: "Buying in master sacks and selling in loose kilograms",
        description:
          "Wholesalers supply in 25kg sacks or 12-piece boxes, but customers buy in 500g or 1kg pouches, making manual inventory counts impossible.",
        remedy:
          "Auto-deduct loose sales from bulk sacks so your stock ledger always reflects exact quantities without daily manual recounting.",
      },
    ],
    keyFeatures: [
      {
        title: "Rapid Barcode & One-Touch Item Quick-Picks",
        description:
          "Connect any affordable USB or wireless barcode gun. For unbarcoded loose grocery items, use customizable touch buttons.",
        benefit: "Cuts average checkout time to less than 15 seconds per customer.",
      },
      {
        title: "Digital Customer Khata & Balances",
        description:
          "Maintain clear customer credit profiles with date-stamped purchase logs, payment receipts, and balance limit warnings.",
        benefit: "Recovers outstanding udhar 3× faster and prevents uncollectible debt.",
      },
      {
        title: "Instant Thermal Receipt Printing",
        description:
          "Print professional 58mm or 80mm cash slips with store name, GSTIN, itemized list, and savings summary.",
        benefit: "Builds trust with neighborhood customers without costly ribbon ink cartridges.",
      },
    ],
    hardwareAdvice: [
      {
        category: "Barcode Scanner",
        recommendation: "Any standard plug-and-play USB 1D/2D handheld barcode gun (TVS, Honeywell, Syble).",
      },
      {
        category: "Receipt Printer",
        recommendation: "58mm or 80mm USB thermal receipt printer (Epson, TVS RP3200, Everycom).",
      },
      {
        category: "Computer / Tablet",
        recommendation: "Any Windows PC, laptop, or Android tablet running Google Chrome or Edge.",
      },
    ],
    faqs: [
      {
        question: "Can I use MiniHisab if my items don't have barcodes?",
        answer:
          "Yes. MiniHisab allows one-touch quick-pick category grids and instant item search by name, brand, or code for loose items like rice, dal, and spices.",
      },
      {
        question: "How does customer Udhar Khata work in MiniHisab?",
        answer:
          "During checkout, you can select 'Credit / Khata' as the payment mode. The bill amount is instantly added to the customer's ledger with transaction date, items bought, and remaining credit balance.",
      },
      {
        question: "Does it work with regular thermal receipt printers?",
        answer:
          "Yes, MiniHisab natively supports all standard 58mm and 80mm ESC/POS thermal printers over USB, Bluetooth, or LAN without requiring complex driver setup.",
      },
    ],
  },
  "pharmacy": {
    slug: "pharmacy",
    name: "Pharmacies & Medical Stores",
    shortName: "Pharmacy",
    tagline: "Batch tracking, expiry warnings, and fast GST billing for medical stores.",
    metaTitle: "Pharmacy Billing Software with Batch & Expiry Tracking | MiniHisab",
    metaDescription: "Reliable chemist & pharmacy billing software in India. Track medicine batches, expiry dates, doctor referrals, customer credit, and GST invoices.",
    keywords: [
      "pharmacy billing software",
      "medical store billing software",
      "chemist billing app india",
      "medicine batch expiry management software",
      "gst billing for medical shop",
    ],
    badge: "Chemist & Medical Retail Suite",
    headline: "Fast medicine billing, batch tracking, and expiry alerts for chemists.",
    subheadline:
      "Never sell expired medicines or lose money on unsold stock. Track batches, strip-to-tablet conversions, doctor tags, and print compliant GST tax invoices in seconds.",
    painPoints: [
      {
        title: "Stock expiring silently on pharmacy shelves",
        description:
          "Bottles and strips sitting unnoticed behind counter shelves until expired mean direct financial write-offs and compliance risks.",
        remedy:
          "Automated 30/60/90-day expiry warning dashboard alerts staff to return items to pharmaceutical distributors before expiry deadlines.",
      },
      {
        title: "Different batches and MRPs for the same medicine",
        description:
          "Pharma companies frequently revise prices and batch codes across new shipments, confusing counter staff during billing.",
        remedy:
          "Batch-wise inventory keeps multiple batch codes and MRPs separate under the same drug formula, auto-selecting the oldest non-expired batch.",
      },
      {
        title: "Selling individual tablets from full blisters/strips",
        description:
          "Patients often purchase 2 or 5 tablets instead of a full strip of 10 or 15, breaking standard unit inventory.",
        remedy:
          "Dual unit conversion allows purchasing in strips/boxes and billing in single loose tablets with accurate pro-rata pricing.",
      },
    ],
    keyFeatures: [
      {
        title: "Batch Number & Expiry Date Management",
        description:
          "Capture batch numbers and expiry dates during stock inward. Print batch and expiry directly on patient bills.",
        benefit: "Ensures 100% Drug & Cosmetic compliance and prevents dispensing expired drugs.",
      },
      {
        title: "Doctor Name & Patient Prescription Tagging",
        description:
          "Record prescribing physician names and patient profiles on tax bills for scheduled drugs.",
        benefit: "Simplifies Schedule H drug audit queries and strengthens repeat patient relationships.",
      },
      {
        title: "Fast Chemist Search by Salt / Brand",
        description:
          "Instant search across brand names and composition codes so staff can answer patient inquiries instantly.",
        benefit: "Speeds up counter service during busy clinic morning and evening hours.",
      },
    ],
    hardwareAdvice: [
      {
        category: "Barcode Scanner",
        recommendation: "2D barcode scanner capable of reading GS1 pharmaceutical data matrix codes.",
      },
      {
        category: "Printer",
        recommendation: "80mm thermal receipt printer for counter slips or A5 laser printer for full medical tax invoices.",
      },
      {
        category: "Backup Power",
        recommendation: "Mini-UPS or laptop battery backup to ensure continuous billing during power fluctuations.",
      },
    ],
    faqs: [
      {
        question: "Can I print batch numbers and expiry dates on patient invoices?",
        answer:
          "Yes. MiniHisab automatically includes the sold item's batch code and expiry date on both thermal receipts and A4/A5 GST invoices.",
      },
      {
        question: "Does MiniHisab alert me before medicines expire?",
        answer:
          "Yes, the dashboard highlights medicines reaching expiry in 30, 60, and 90 days so you can return them to distributors for credit notes.",
      },
      {
        question: "Can I manage regular patient credit accounts?",
        answer:
          "Yes. Chronic disease patients with monthly medicine cycles can maintain running credit accounts with automated statements and payment records.",
      },
    ],
  },
  "clothing-store": {
    slug: "clothing-store",
    name: "Clothing & Garment Outlets",
    shortName: "Clothing Store",
    tagline: "Size, color, barcode tags, and rapid billing for apparel & fashion retail.",
    metaTitle: "Clothing & Apparel Store Billing Software with Size-Color Matrix | MiniHisab",
    metaDescription: "Streamline garment retail with size-color-style matrix, custom barcode tags, festival discounts, and rapid checkout counter POS.",
    keywords: [
      "clothing store billing software",
      "garment shop billing software",
      "apparel pos system india",
      "fashion retail billing software",
      "barcode billing software for clothes shop",
    ],
    badge: "Fashion & Garment Retail POS",
    headline: "Size-color variants, barcode tags, and rapid checkout for garment stores.",
    subheadline:
      "Manage hundreds of shirt, trouser, and dress variations without clutter. Print custom price tags, apply festival discounts, and track best-selling styles effortlessly.",
    painPoints: [
      {
        title: "Managing dozens of size and color permutations per style",
        description:
          "Creating individual product listings for every combination (S, M, L, XL, XXL in 4 colors) clutters catalog management.",
        remedy:
          "Unified SKU variant matrix groups sizes and colors under single style parents with shared descriptions and grouped stock counts.",
      },
      {
        title: "Lost sales due to out-of-stock sizes on the shop floor",
        description:
          "Customers walk away when cashiers cannot instantly tell if a size 32 trouser is in the back godown or trial room.",
        remedy:
          "Real-time outlet stock lookup shows exact availability by size and color across shelves and storerooms immediately.",
      },
      {
        title: "Complicated exchange and return handling",
        description:
          "Customers exchanging a shirt for a different size or style create messy manual invoice adjustments and inventory errors.",
        remedy:
          "One-click return and exchange flow adjusts inventory and offsets bill totals on the counter in seconds.",
      },
    ],
    keyFeatures: [
      {
        title: "Size-Color-Fit SKU Matrix",
        description:
          "Define master design styles and generate size and color variants in one click with individual barcode tags.",
        benefit: "Reduces catalog entry time by 80% for seasonal apparel collections.",
      },
      {
        title: "Instant Promotional Discounts & Bundle Offers",
        description:
          "Set flat percentage discounts, festive clearance pricing, or bill-level discounts with cashier permission controls.",
        benefit: "Executes clearance sales and festive seasons smoothly without billing errors.",
      },
      {
        title: "Customer Purchase History for Tailored Styling",
        description:
          "Save customer contact details and view their past size preferences and purchase history during counter visits.",
        benefit: "Improves personalized service and increases repeat customer basket value.",
      },
    ],
    hardwareAdvice: [
      {
        category: "Barcode Scanner",
        recommendation: "Wireless 2.4GHz handheld scanner so staff can scan garment tags directly on hangers or racks.",
      },
      {
        category: "Barcode Tag Printer",
        recommendation: "Standard thermal transfer barcode sticker printer (TVS LP46, TSC TE244).",
      },
      {
        category: "Bill Printer",
        recommendation: "80mm thermal receipt printer for high-speed counter checkout.",
      },
    ],
    faqs: [
      {
        question: "Can I generate and print our own barcode stickers for clothing items?",
        answer:
          "Yes. MiniHisab supports barcode generation and printing on standard barcode sticker rolls compatible with desktop barcode printers.",
      },
      {
        question: "Does it support garment exchanges?",
        answer:
          "Yes. The billing screen allows quick returns and exchanges within the same checkout, recalculating tax and price differences automatically.",
      },
      {
        question: "Can I manage multiple garment branches?",
        answer:
          "Yes. You can track inventory and transfer styles between multiple shops and godowns with inter-branch dispatch challans.",
      },
    ],
  },
  "grocery-store": {
    slug: "grocery-store",
    name: "Grocery Stores & Mini-Marts",
    shortName: "Grocery Store",
    tagline: "High-volume FMCG checkout, loose grain conversions, and stock monitoring.",
    metaTitle: "Grocery Store Billing Software & Inventory POS | MiniHisab",
    metaDescription: "Speed up grocery counter queues with barcode scanning, weighing scale connectivity, loose item conversion, and supplier purchase orders.",
    keywords: [
      "grocery store billing software",
      "supermarket billing software india",
      "fmcg inventory management software",
      "grocery pos counter software",
      "provision store billing software",
    ],
    badge: "Grocery & Mini-Mart Suite",
    headline: "Speed up grocery counter checkout and track fast-moving FMCG items.",
    subheadline:
      "Handle high-frequency customer baskets with continuous barcode scanning, weighing scale conversions, split payment collections, and instant cash reconciliation.",
    painPoints: [
      {
        title: "Cashier mistakes with mixed payment methods",
        description:
          "Customers paying half in cash and balance via Google Pay / Paytm cause register closing mismatches at night.",
        remedy:
          "Split tender allows recording exact amounts split between Cash and UPI QR, maintaining 100% balanced registers.",
      },
      {
        title: "Stock shrinkage and pilferage in fast-moving items",
        description:
          "Without automated stock reduction, shrinkage and unrecorded thefts go undetected until year-end audits.",
        remedy:
          "Real-time item deduction upon bill confirmation coupled with daily stock spot-check reports spots discrepancies immediately.",
      },
      {
        title: "Repetitive manual entry for supplier FMCG deliveries",
        description:
          "Typing dozens of weekly supplier invoices by hand delays stock getting to retail display shelves.",
        remedy:
          "Bulk CSV/Excel catalog and stock import uploads hundreds of supplier items in seconds.",
      },
    ],
    keyFeatures: [
      {
        title: "High-Speed Continuous Barcode Scanning",
        description:
          "Scan items consecutively without touching the keyboard. Immediate beep feedback confirms each scanned product.",
        benefit: "Processes 30-item grocery baskets in under 45 seconds.",
      },
      {
        title: "Multi-Cart Hold & Resume",
        description:
          "If a customer steps away to grab one more item, hold their cart with one keypress and bill the next shopper.",
        benefit: "Keeps checkout lines moving smoothly without canceling or re-scanning items.",
      },
      {
        title: "Day-End Cash & Register Reconciliation",
        description:
          "Reconcile cashier drawer cash against recorded sales, view category turnovers, and print shift closing summaries.",
        benefit: "Prevents cashier drawer shortages and secures store revenue daily.",
      },
    ],
    hardwareAdvice: [
      {
        category: "Barcode Scanner",
        recommendation: "Omnidirectional tabletop scanner or fast 2D handheld gun for rapid barcode pass-through.",
      },
      {
        category: "Receipt Printer",
        recommendation: "80mm high-speed thermal printer with auto-cutter.",
      },
      {
        category: "Cash Drawer",
        recommendation: "Standard RJ11 cash drawer triggered automatically upon thermal receipt print.",
      },
    ],
    faqs: [
      {
        question: "Can cashiers bill customers without using a mouse?",
        answer:
          "Yes. MiniHisab is built with intuitive keyboard shortcuts for item search, quantity change, tender selection, and bill printing.",
      },
      {
        question: "Can I hold an active bill if a customer forgot something?",
        answer:
          "Yes. Use the Hold Cart feature to park the customer's items, ring up the next customer, and resume the parked cart when they return.",
      },
      {
        question: "How does MiniHisab handle GSTR-1 for grocery stores?",
        answer:
          "It automatically segregates 0% (exempt food grains), 5%, 12%, and 18% GST items and exports complete HSN summary spreadsheets ready for tax filing.",
      },
    ],
  },
  "wholesale-distributor": {
    slug: "wholesale-distributor",
    name: "Wholesale Distributors & Stockists",
    shortName: "Wholesale Distributor",
    tagline: "Master carton rates, trade credit terms, delivery challans, and B2B GST tax invoices.",
    metaTitle: "Wholesale Billing Software & Distribution Inventory | MiniHisab",
    metaDescription: "Scale wholesale distribution with master carton pricing, B2B GST tax invoices, customer trade credit limits, and godown dispatch challans.",
    keywords: [
      "wholesale billing software",
      "distributor billing software india",
      "b2b invoice software",
      "godown inventory management",
      "wholesale credit ledger app",
    ],
    badge: "B2B Wholesale & Godown Suite",
    headline: "Master carton billing, trade credit ledgers, and B2B GST invoices.",
    subheadline:
      "Engineered for wholesale stockists and distributors dispatching master cartons, managing 15 to 30-day retailer credit cycles, and coordinating central godown transfers.",
    painPoints: [
      {
        title: "Overdue retailer credit choking working capital",
        description:
          "Retailers purchasing on 15-day credit delay payments, leading to severe cash flow crunches without structured credit monitoring.",
        remedy:
          "Set hard credit limits and payment windows per retailer. System alerts cashiers before dispatching new orders to overdue buyers.",
      },
      {
        title: "Confusion between master carton and piece pricing",
        description:
          "Quoting carton trade rates versus single unit piece prices often causes invoicing discrepancies with retail buyers.",
        remedy:
          "Dual-rate system maintains both wholesale carton prices and unit prices, auto-calculating totals based on ordered pack quantities.",
      },
      {
        title: "Disorganized godown dispatch and transport paperwork",
        description:
          "Manual dispatch slips cause loading discrepancies between warehouse workers and delivery drivers.",
        remedy:
          "Generate professional A4 GST tax invoices with transporter names, vehicle registration numbers, and digital dispatch challans.",
      },
    ],
    keyFeatures: [
      {
        title: "Master Carton & Inner Pack Conversions",
        description:
          "Receive goods in 50-carton master batches and dispatch to retailers in mixed carton or loose box configurations.",
        benefit: "Eliminates warehouse stock mismatch and speeds up order fulfillment.",
      },
      {
        title: "Retailer Trade Credit Ledgers & Statements",
        description:
          "Full B2B running ledger tracking invoices, partial bank payments, Cheque/NEFT settlements, and outstanding credit aging.",
        benefit: "Recovers outstanding receivables faster with printable WhatsApp-shareable statements.",
      },
      {
        title: "Full A4 & A5 B2B GST Tax Invoices",
        description:
          "Compliant tax invoices with buyer GSTIN validation, state POS rules, reverse charge indicators, and HSN breakdowns.",
        benefit: "Eliminates CA filing queries and ensures 100% input tax credit (ITC) compliance for buyers.",
      },
    ],
    hardwareAdvice: [
      {
        category: "Invoice Printer",
        recommendation: "A4 or A5 duplex laser or heavy-duty inkjet printer for formal B2B multi-copy tax invoices.",
      },
      {
        category: "Barcode Scanner",
        recommendation: "Long-range wireless barcode scanner for scanning cartons across godown pallets.",
      },
      {
        category: "Godown Terminal",
        recommendation: "Desktop PC or rugged Android tablet connected via warehouse Wi-Fi.",
      },
    ],
    faqs: [
      {
        question: "Can I print A4 tax invoices with vehicle and transporter details?",
        answer:
          "Yes. MiniHisab allows entering transporter name, vehicle number, and e-way bill reference directly on A4 and A5 tax invoices.",
      },
      {
        question: "Can I set different credit limits for different retailers?",
        answer:
          "Yes. You can configure individual credit limits and payment due days (e.g., ₹50,000 credit with 21-day terms) for each B2B customer.",
      },
      {
        question: "Can we manage multiple godowns and stock transfers?",
        answer:
          "Yes. You can create stock transfer requests from branch stores to central godowns and track dispatch challans until received.",
      },
    ],
  },
  "hardware-store": {
    slug: "hardware-store",
    name: "Hardware, Electrical & Sanitaryware",
    shortName: "Hardware Store",
    tagline: "Manage meters, bundles, kilograms, and contractor credit ledgers in one place.",
    metaTitle: "Hardware & Electrical Store Billing Software | MiniHisab",
    metaDescription: "Tailored billing software for hardware, electrical, and sanitary shops. Multi-unit measurements, contractor credit ledgers, and fast GST invoices.",
    keywords: [
      "hardware store billing software",
      "electrical shop billing software",
      "sanitaryware billing software india",
      "contractor credit ledger software",
      "pipe cable unit conversion billing",
    ],
    badge: "Hardware & Electrical Suite",
    headline: "Multi-unit measurement, contractor khata, and GST billing for hardware stores.",
    subheadline:
      "From pipes in meters and nails in kilograms to switches in boxes: MiniHisab handles diverse hardware unit conversions and tracks running contractor credit accounts.",
    painPoints: [
      {
        title: "Complex multi-unit pricing (meters, bundles, kilograms, pieces)",
        description:
          "Electrical cables sold by meter, nails sold by weight, and sanitary fittings sold by piece make standard billing software stumble.",
        remedy:
          "Flexible decimal unit support allows billing seamlessly in meters, feet, kilograms, bundles, and pieces with precise decimal calculations.",
      },
      {
        title: "Electricians and plumbers taking materials on running credit",
        description:
          "Contractors pick up materials across multiple construction sites every week, settling bills only after client stage payments.",
        remedy:
          "Dedicated contractor running khata tracks materials by site reference, dates, and partial payments, generating clean itemized statements.",
      },
      {
        title: "Varying GST rates across hardware items (12%, 18%, 28%)",
        description:
          "Mixing paints (28%), electrical fittings (18%), and certain construction materials (12%) creates tax calculation errors on bills.",
        remedy:
          "Item-level automated HSN and GST tax mapping applies exact statutory slabs automatically on every invoice.",
      },
    ],
    keyFeatures: [
      {
        title: "Flexible Fractional Unit Conversions",
        description:
          "Measure cables, pipes, wires, and sheets in exact decimal fractions with automated stock deduction.",
        benefit: "Prevents inventory leaks in cut-to-order hardware materials.",
      },
      {
        title: "Contractor Project-Wise Udhar Khata",
        description:
          "Maintain clear contractor running credit with site remarks, allowing itemized reconciliation before monthly settlements.",
        benefit: "Speeds up contractor payment collections and avoids disputed material counts.",
      },
      {
        title: "A4 Formal Invoices & Thermal Counter Slips",
        description:
          "Print quick 80mm thermal slips for small walk-in cash retail, and full A4 tax invoices for large building material dispatches.",
        benefit: "Provides the right invoice format for every type of customer transaction.",
      },
    ],
    hardwareAdvice: [
      {
        category: "Printer Setup",
        recommendation: "Dual setup: 80mm thermal printer at counter for walk-ins + A4 laser printer for contractors and GST invoices.",
      },
      {
        category: "Barcode Scanner",
        recommendation: "Rugged USB 1D/2D scanner resistant to hardware shop dust and debris.",
      },
      {
        category: "Computer",
        recommendation: "Any standard desktop computer or laptop running Windows 10/11 or macOS.",
      },
    ],
    faqs: [
      {
        question: "Can I bill in fractional units like 4.5 meters or 1.25 kilograms?",
        answer:
          "Yes. MiniHisab supports fractional decimal quantities for products measured by length, weight, or volume.",
      },
      {
        question: "Can I keep separate running ledgers for different contractors?",
        answer:
          "Yes. Each contractor gets a dedicated customer profile with their running credit balance, phone number, and transaction history.",
      },
      {
        question: "Does it support both thermal receipts and A4 tax invoices?",
        answer:
          "Yes. You can switch between 80mm thermal slips for small counter sales and full A4 laser invoices for contractor and B2B orders with one click.",
      },
    ],
  },
  "electronics-shop": {
    slug: "electronics-shop",
    name: "Consumer Electronics & Mobile Shops",
    shortName: "Electronics Shop",
    tagline: "Serial number, IMEI tracking, warranty records, and GST billing for electronics retail.",
    metaTitle: "Electronics & Mobile Shop Billing Software with Serial/IMEI Tracking | MiniHisab",
    metaDescription: "Complete billing software for electronics and mobile shops in India. Track IMEI numbers, warranty terms, brand margins, and print GST tax invoices.",
    keywords: [
      "electronics shop billing software",
      "mobile shop billing software",
      "imei tracking billing software",
      "warranty tracking pos software",
      "electronics retail pos india",
    ],
    badge: "Electronics & Mobile Retail POS",
    headline: "Serial numbers, IMEI tracking, warranty slips, and GST tax invoices.",
    subheadline:
      "Built for electronics retailers and smartphone dealers. Capture serial and IMEI numbers on invoices, verify warranty claims instantly, and track brand-wise profit margins.",
    painPoints: [
      {
        title: "Disputes over customer warranty and serial numbers",
        description:
          "Customers returning defective electronics without proof of purchase date or serial verification lead to brand claim rejections.",
        remedy:
          "Capture serial or IMEI numbers during checkout and print them on customer tax invoices for permanent audit records.",
      },
      {
        title: "High-value inventory requiring tight security controls",
        description:
          "Smartphones, smartwatches, and premium audio equipment require strict stock accountability to prevent internal loss.",
        remedy:
          "Staff role permissions hide cost prices, require manager authorization for bill discounts or cancellations, and log every stock change.",
      },
      {
        title: "Tracking sales and commissions across multiple brands",
        description:
          "Electronics dealers need to know which brand (Samsung, Vivo, Xiaomi, Apple) generated the highest margin each month.",
        remedy:
          "Brand-level and category-level gross profit reporting breaks down turnover and net margins across all manufacturer lines.",
      },
    ],
    keyFeatures: [
      {
        title: "Serial Number & IMEI Tracking on Invoices",
        description:
          "Input or scan IMEI and serial numbers directly during billing. Output printed directly onto A4 or thermal receipts.",
        benefit: "Eliminates fake warranty claims and simplifies brand service center interactions.",
      },
      {
        title: "Brand-Wise Profit & Margin Intelligence",
        description:
          "Monitor sales performance, revenue contribution, and profit margins separated by device brands and accessory lines.",
        benefit: "Helps you negotiate better distributor margins and incentive targets.",
      },
      {
        title: "Role-Based Cashier Security & Cost Masking",
        description:
          "Prevent floor sales staff from viewing distributor cost prices, distributor margins, or backend supplier details.",
        benefit: "Protects sensitive trade margins and prevents unauthorized bill modifications.",
      },
    ],
    hardwareAdvice: [
      {
        category: "Barcode Gun",
        recommendation: "High-density 2D barcode scanner capable of scanning tiny IMEI serial barcodes on smartphone boxes.",
      },
      {
        category: "Invoice Printer",
        recommendation: "A4 laser printer for warranty-valid tax invoices and 80mm thermal printer for accessories.",
      },
      {
        category: "POS Terminal",
        recommendation: "Desktop PC or sleek touchscreen terminal at the main checkout counter.",
      },
    ],
    faqs: [
      {
        question: "Can I record IMEI and serial numbers during billing?",
        answer:
          "Yes. MiniHisab allows entering or scanning device IMEI and serial numbers which are automatically printed on the customer's GST invoice.",
      },
      {
        question: "Can I hide purchase cost prices from sales cashiers?",
        answer:
          "Yes. MiniHisab includes role-based access control where cashiers only see retail prices, while cost prices and gross margins remain visible only to owners.",
      },
      {
        question: "Can I print A4 invoices suitable for manufacturer warranty?",
        answer:
          "Yes. Full A4 tax invoices include store GSTIN, customer details, product serials, and tax bifurcation acceptable at all authorized brand service centers.",
      },
    ],
  },
  "stationery-shop": {
    slug: "stationery-shop",
    name: "Stationery & Bookstores",
    shortName: "Stationery Shop",
    tagline: "Fast micro-item billing, school book bundles, and school account khata.",
    metaTitle: "Stationery & Bookstore Billing Software POS | MiniHisab",
    metaDescription: "Manage thousands of stationery SKUs, school book sets, institutional khata accounts, and print rapid thermal receipts with MiniHisab.",
    keywords: [
      "stationery shop billing software",
      "book store pos software",
      "book shop billing software india",
      "school book bundle billing",
      "retail stationery pos",
    ],
    badge: "Stationery & Bookstore POS",
    headline: "Fast micro-item checkout, book sets, and school credit ledgers.",
    subheadline:
      "Manage thousands of low-ticket stationery items alongside textbook bundles and school institutional credit accounts without slowing down counter billing.",
    painPoints: [
      {
        title: "Huge SKU catalog with hundreds of small ₹5–₹50 items",
        description:
          "Pens, erasers, notebooks, craft paper, and adhesives create thousands of micro SKUs that slow down manual search.",
        remedy:
          "One-touch quick categories and fast barcode auto-scan let cashiers bill small stationery items in fractions of a second.",
      },
      {
        title: "Back-to-school season rush lines",
        description:
          "When schools reopen, hundreds of parents queue up simultaneously for complete class book and notebook sets.",
        remedy:
          "Multi-cart hold, hotkey billing, and instant thermal receipts process parent lines rapidly without cashier fatigue.",
      },
      {
        title: "Managing credit accounts for schools and coaching institutes",
        description:
          "Local schools and tuition centers order office supplies on monthly credit, requiring clear reconciliation statements.",
        remedy:
          "Institutional customer khata logs monthly purchases and prints clear itemized statements for school administration approvals.",
      },
    ],
    keyFeatures: [
      {
        title: "Quick-Touch Stationery Category Panels",
        description:
          "Group common pencils, pens, glues, and notebooks into colorful touch tiles for instant one-click billing.",
        benefit: "Eliminates typing delays for non-barcoded pocket items.",
      },
      {
        title: "Institutional School Credit Ledgers",
        description:
          "Maintain monthly running credit balances for corporate offices, coaching classes, and schools with payment receipt logs.",
        benefit: "Expedites monthly institutional bill settlement with clean documentation.",
      },
      {
        title: "Instant Thermal Receipt Printing",
        description:
          "Print 58mm or 80mm itemized slips with store branding, contact info, and exchange policy notes.",
        benefit: "Delivers clean, professional receipts at minimal per-bill paper cost.",
      },
    ],
    hardwareAdvice: [
      {
        category: "Scanner",
        recommendation: "Standard USB 1D/2D handheld barcode scanner.",
      },
      {
        category: "Printer",
        recommendation: "58mm or 80mm thermal receipt printer with fast print speed.",
      },
      {
        category: "Device",
        recommendation: "Compact counter laptop or POS desktop.",
      },
    ],
    faqs: [
      {
        question: "Can I bill items that do not have printed barcodes?",
        answer:
          "Yes. You can assign short product codes or use quick-pick screen tiles to add items like single pencils or chart papers with one touch.",
      },
      {
        question: "Can I manage monthly supply accounts for schools and offices?",
        answer:
          "Yes. MiniHisab allows setting up institutional customer profiles with monthly credit tracking and printable ledger statements.",
      },
      {
        question: "Does it support GST on books and stationery?",
        answer:
          "Yes. It automatically handles GST-exempt printed books (0%) alongside taxed stationery items (12% and 18%) on the same invoice.",
      },
    ],
  },
  "cosmetics-store": {
    slug: "cosmetics-store",
    name: "Cosmetics & Beauty Outlets",
    shortName: "Cosmetics Store",
    tagline: "Shade variants, expiry monitoring, loyalty credit, and rapid cosmetic billing.",
    metaTitle: "Cosmetics & Beauty Store Billing Software | MiniHisab",
    metaDescription: "Speed up beauty and cosmetics store billing. Manage makeup shades, perfume batch expiry, customer profiles, and GST tax invoices.",
    keywords: [
      "cosmetics store billing software",
      "beauty shop pos software",
      "makeup retail billing software india",
      "perfume store inventory software",
      "cosmetics expiry tracking software",
    ],
    badge: "Cosmetics & Beauty POS",
    headline: "Shade variants, perfume expiry tracking, and elegant customer receipts.",
    subheadline:
      "Organize thousands of lipstick shades, skincare batches, and fragrance lines. Track beauty product expiry dates, offer promotional discounts, and build repeat customer loyalty.",
    painPoints: [
      {
        title: "Hundreds of shades and tones under the same brand",
        description:
          "Managing 30 lipstick shades or 15 foundation tones as separate products clutters catalog management and inventory searches.",
        remedy:
          "SKU variant matrices organize all shades cleanly under parent cosmetic lines with individual barcode labels.",
      },
      {
        title: "Premium skincare and makeup expiring on shelves",
        description:
          "High-value organic serums and foundations reaching expiry unnoticed lead to heavy inventory write-offs.",
        remedy:
          "Automated 60-day expiry alert reports flag aging cosmetic stock so you can run promotional clearance campaigns in time.",
      },
      {
        title: "Customer contact capture and personalized beauty recommendations",
        description:
          "Beauty shoppers expect cashiers to recall their preferred foundation shade, brand preferences, or loyalty balances.",
        remedy:
          "Customer profile history shows previous purchases and shade choices during counter visits, building strong customer loyalty.",
      },
    ],
    keyFeatures: [
      {
        title: "Cosmetic Shade & Volume Variants",
        description:
          "Organize products by shade, tone, and container size (30ml, 50ml, 100ml) with barcode scan support.",
        benefit: "Speeds up counter lookup for specific cosmetic colors and formulations.",
      },
      {
        title: "Cosmetic Expiry & Shelf Life Alerts",
        description:
          "Monitor manufactured batches and shelf-life milestones across sensitive skincare, haircare, and makeup lines.",
        benefit: "Prevents customer complaints and write-offs on expiring beauty stock.",
      },
      {
        title: "Promotional Combos & Festive Offers",
        description:
          "Create seasonal cosmetic bundles, bridal packages, and discount percentages with automated margin calculation.",
        benefit: "Increases average order value during wedding and festive shopping seasons.",
      },
    ],
    hardwareAdvice: [
      {
        category: "Barcode Scanner",
        recommendation: "High-accuracy 2D scanner capable of reading curved barcodes on small lipstick and eyeliner tubes.",
      },
      {
        category: "Receipt Printer",
        recommendation: "80mm thermal receipt printer with custom header and social media handles.",
      },
      {
        category: "Counter Screen",
        recommendation: "Modern all-in-one touch PC or tablet for an upscale retail aesthetic.",
      },
    ],
    faqs: [
      {
        question: "Can I manage different shades of lipsticks and foundations under one product?",
        answer:
          "Yes. MiniHisab allows creating parent products with multiple shade variants, each carrying its own barcode and inventory count.",
      },
      {
        question: "Does it track skincare expiry dates?",
        answer:
          "Yes. You can record batch numbers and expiry dates during stock inward and receive automated alerts for aging skincare products.",
      },
      {
        question: "Can I customize the thermal receipt with our salon/boutique logo?",
        answer:
          "Yes. You can include your brand name, store address, GSTIN, telephone, and promotional Instagram handles on every printed receipt.",
      },
    ],
  },
  "mobile-shop": {
    slug: "mobile-shop",
    name: "Mobile Phones & Repair Stores",
    shortName: "Mobile Shop",
    tagline: "IMEI barcode tracking, accessory counter sales, and repair job records.",
    metaTitle: "Mobile Shop Billing Software with IMEI & Repair Tracking | MiniHisab",
    metaDescription: "Best mobile shop billing software in India. Dual IMEI number scanning, smartphone warranty bills, accessory POS, and customer credit ledgers.",
    keywords: [
      "mobile shop billing software",
      "mobile store pos software india",
      "imei billing software for mobile shop",
      "mobile accessories billing pos",
      "smartphone gst billing software",
    ],
    badge: "Mobile Retail & Accessories POS",
    headline: "Dual IMEI tracking, accessory quick-billing, and warranty GST invoices.",
    subheadline:
      "Engineered specifically for smartphone retailers. Scan dual IMEI barcodes effortlessly, print warranty-valid GST tax invoices, and ring up high-margin accessories in seconds.",
    painPoints: [
      {
        title: "Typing 15-digit dual IMEI numbers manually during billing",
        description:
          "Manual IMEI typing is slow, prone to typographical errors, and causes customer friction at the checkout counter.",
        remedy:
          "Scan IMEI 1 and IMEI 2 directly from phone packaging using any 2D barcode scanner with instant validation.",
      },
      {
        title: "Managing thousands of micro mobile accessories (cases, cables, glass)",
        description:
          "Low-ticket accessories carry 50%+ margins, but slow non-barcoded lookups discourage staff from billing them systematically.",
        remedy:
          "Quick-touch accessory buttons (tempered glass, 20W charger, type-C cable) allow one-touch billing without barcode searches.",
      },
      {
        title: "Disputed customer warranty and replacement claims",
        description:
          "Customers returning damaged handsets without authentic proof of purchase create disputes with distributors and service centers.",
        remedy:
          "Invoices permanently store customer contact, handset IMEI, brand model, and sale date for instant lookup and verification.",
      },
    ],
    keyFeatures: [
      {
        title: "Instant Dual IMEI Scanning & Validation",
        description:
          "Scan dual IMEI barcodes from handset packaging directly into the invoice. Automatically prints on customer bills.",
        benefit: "Reduces smartphone billing time from 5 minutes down to 30 seconds.",
      },
      {
        title: "Fast-Touch Mobile Accessories Grid",
        description:
          "Organize tempered glasses, back covers, earphones, and chargers into quick-pick buttons for fast counter sales.",
        benefit: "Captures high-margin accessory sales without slowing down counter traffic.",
      },
      {
        title: "Customer Phone Number Lookup & Warranty Records",
        description:
          "Search past bills by customer phone number or handset IMEI to confirm warranty validity instantly.",
        benefit: "Simplifies warranty verification and builds neighborhood customer trust.",
      },
    ],
    hardwareAdvice: [
      {
        category: "Barcode Scanner",
        recommendation: "High-density 2D scanner designed to read tiny IMEI barcodes from glossy phone box labels.",
      },
      {
        category: "Printer Setup",
        recommendation: "A4 laser printer for smartphone tax invoices and 80mm thermal printer for fast accessory sales.",
      },
      {
        category: "Counter Terminal",
        recommendation: "Desktop PC or laptop with internet access.",
      },
    ],
    faqs: [
      {
        question: "Can I scan both IMEI 1 and IMEI 2 on a single bill?",
        answer:
          "Yes. MiniHisab allows scanning or entering dual IMEI numbers which are formatted and printed cleanly on the customer tax invoice.",
      },
      {
        question: "Does it support fast billing for non-barcoded tempered glass and covers?",
        answer:
          "Yes. You can use quick-pick tiles for generic accessories and enter custom prices on the fly if needed.",
      },
      {
        question: "Can I look up a customer's bill if they lost their physical paper copy?",
        answer:
          "Yes. You can search the invoice registry by customer mobile number, name, or handset IMEI to reprint or review their bill anytime.",
      },
    ],
  },
  "bakery": {
    slug: "bakery",
    name: "Bakeries, Sweet Shops & Cafes",
    shortName: "Bakery",
    tagline: "High-speed counter billing, cake advance orders, and daily cash balancing.",
    metaTitle: "Bakery & Sweet Shop Billing Software POS | MiniHisab",
    metaDescription: "Fast counter POS billing software for bakeries and sweet shops. Manage cake advance bookings, fresh batch tracking, split payments, and thermal receipts.",
    keywords: [
      "bakery billing software",
      "sweet shop pos software india",
      "mithai shop billing software",
      "cake shop billing software",
      "fast counter pos for bakery",
    ],
    badge: "Bakery & Confectionery POS",
    headline: "Fast counter checkout, cake advance bookings, and daily cash reconciliation.",
    subheadline:
      "Designed for bakeries, sweet shops, and confectionery counters. Punch bills in seconds during festive rush hours, take custom cake advance orders, and balance registers cleanly.",
    painPoints: [
      {
        title: "Heavy evening rush with impatient counter crowds",
        description:
          "Customers waiting for fresh bread, pastries, and snacks walk out if counter billing takes more than 10 seconds per order.",
        remedy:
          "Touch-friendly quick menu tiles and fast hotkeys allow cashiers to punch items and trigger thermal receipts in 2 clicks.",
      },
      {
        title: "Custom cake advance bookings and balance collections",
        description:
          "Cake orders taken on scrap paper lead to forgotten delivery times, incorrect flavor notes, and untracked advance deposits.",
        remedy:
          "Advance order booking captures delivery date, custom flavor messages, advance deposits, and outstanding balance upon pickup.",
      },
      {
        title: "Short shelf-life fresh items spoiling overnight",
        description:
          "Fresh cream cakes and Bengali sweets spoil if unsold within 24 to 48 hours, eating into store profits.",
        remedy:
          "Daily product sales analytics show exact customer demand trends, preventing overproduction of perishable sweet items.",
      },
    ],
    keyFeatures: [
      {
        title: "Visual Quick-Menu Touch Tiles",
        description:
          "Organize pastries, biscuits, breads, and sweets into visual icon grids for instant counter cashier selection.",
        benefit: "Clears customer queues 4× faster than typing item names.",
      },
      {
        title: "Split Tender (Cash + UPI QR) in One Bill",
        description:
          "Accept partial cash and remaining balance via UPI QR code smoothly with automatic register reconciliation.",
        benefit: "Accommodates modern customer payment habits without register shortages.",
      },
      {
        title: "Shift-Wise Cash & Drawer Reconciliation",
        description:
          "Track opening cash, midday cash pickups, and evening drawer totals per cashier shift.",
        benefit: "Maintains 100% financial accountability across morning and evening staff shifts.",
      },
    ],
    hardwareAdvice: [
      {
        category: "Touch Terminal",
        recommendation: "Touchscreen all-in-one POS PC or tablet mounted on counter for fastest fingertip billing.",
      },
      {
        category: "Receipt Printer",
        recommendation: "80mm thermal receipt printer with fast 250mm/s auto-cutter.",
      },
      {
        category: "Cash Drawer",
        recommendation: "Automated electric cash drawer connected to the thermal printer RJ11 port.",
      },
    ],
    faqs: [
      {
        question: "Can cashiers bill customers using a touch screen without a keyboard?",
        answer:
          "Yes. MiniHisab is optimized for touch terminals and tablets with large finger-friendly tiles for quick item selection and billing.",
      },
      {
        question: "Can I manage multiple bakery outlets and central baking units?",
        answer:
          "Yes. You can manage multiple retail bakery branches from one dashboard and track fresh stock dispatches from your central kitchen.",
      },
      {
        question: "Does it support UPI payments with thermal receipts?",
        answer:
          "Yes. Cashiers can record UPI payments and print 80mm thermal receipts with payment mode and store details in under two seconds.",
      },
    ],
  },
  "supermarket": {
    slug: "supermarket",
    name: "Supermarkets & Departmental Stores",
    shortName: "Supermarket",
    tagline: "Multi-counter checkout, thousands of SKUs, godown transfers, and real-time inventory.",
    metaTitle: "Supermarket Billing Software & Multi-Counter POS | MiniHisab",
    metaDescription: "Scalable supermarket POS software in India. Multi-counter registers, continuous barcode scanning, godown stock sync, and role-based staff permissions.",
    keywords: [
      "supermarket billing software",
      "departmental store pos software",
      "multi counter billing software india",
      "supermarket inventory management",
      "retail supermarket pos system",
    ],
    badge: "Supermarket & Modern Trade POS",
    headline: "Multi-counter registers, godown sync, and lightning barcode billing.",
    subheadline:
      "Scale your supermarket or departmental store with multi-counter POS terminals, central godown replenishment, multi-cart hold, and comprehensive financial reports.",
    painPoints: [
      {
        title: "Long customer queues choking checkout during peak weekends",
        description:
          "Slow scanning, delayed receipt printing, and frozen software cause cart abandonment and customer complaints.",
        remedy:
          "Lightning-fast barcode auto-detection, keyboard navigation, and sub-second 80mm thermal printing keep checkout lanes flying.",
      },
      {
        title: "Discrepancy between supermarket shelves and back godowns",
        description:
          "Without automated stock transfer records, store managers never know if items are in the warehouse or on shelf aisles.",
        remedy:
          "Inter-outlet and godown stock transfer challans verify transfers digitally, keeping master stock counts 100% accurate.",
      },
      {
        title: "Staff theft, unauthorized discounts, and cash drawer leaks",
        description:
          "Managing multiple cashiers without strict role controls leads to price tampering and till shortages.",
        remedy:
          "Staff role security hides purchase costs, locks manual price overrides, and logs every cancelled bill into tamper-proof audit trails.",
      },
    ],
    keyFeatures: [
      {
        title: "Multi-Counter Lane Architecture",
        description:
          "Run 2, 5, or 10 checkout registers simultaneously syncing to the same central catalog and inventory database in real time.",
        benefit: "Expands checkout capacity during festival rushes without data conflicts.",
      },
      {
        title: "Multi-Cart Hold & Rapid Queue Recovery",
        description:
          "Hold active customer carts when a customer steps away to pick up more items, and resume instantly when they return.",
        benefit: "Prevents bottlenecks at the front of checkout lanes.",
      },
      {
        title: "Consolidated Multi-Store & Godown Analytics",
        description:
          "View live turnover, top-selling categories, stock valuation, and gross margins across all store branches from your phone.",
        benefit: "Enables data-driven restocking and centralized purchasing from FMCG distributors.",
      },
    ],
    hardwareAdvice: [
      {
        category: "Barcode Scanner",
        recommendation: "High-speed omnidirectional multi-line laser or 2D imaging scanner for pass-through barcode reading.",
      },
      {
        category: "Printer",
        recommendation: "Heavy-duty 80mm thermal receipt printer with automatic cutter (Epson TM-T82, TVS).",
      },
      {
        category: "Registers",
        recommendation: "Dedicated POS desktop PC or touchscreen terminal with RJ11 cash drawer per lane.",
      },
    ],
    faqs: [
      {
        question: "Can multiple cashiers bill at different counters at the same time?",
        answer:
          "Yes. MiniHisab supports multi-counter operations where multiple registers run concurrently with independent drawer balancing.",
      },
      {
        question: "How does it handle bulk inventory imports for thousands of supermarket items?",
        answer:
          "You can import your entire catalog of 10,000+ items with barcodes, HSN codes, MRPs, and cost prices using Excel or CSV templates in seconds.",
      },
      {
        question: "Can store owners monitor live sales from outside the store?",
        answer:
          "Yes. MiniHisab is a cloud platform. Owners can log in securely from their smartphone or laptop anywhere in the world to view real-time sales and stock levels.",
      },
    ],
  },
};
