import { Language } from './translations';

// Covers existing screen copy that has not yet been migrated to keyed translations.
// API values, names, identifiers, payment-provider names, and entered data are left intact.
const somali: Record<string, string> = {
  'Hormuud EVC Plus / WaafiPay (0611688269)': 'Hormuud EVC Plus / WaafiPay (0611688269)',
  'Somtel eDahab / WaafiPay (0621688269)': 'Somtel eDahab / WaafiPay (0621688269)',
  'Salaam Somali Bank (AccN: 38524624)': 'Salaam Somali Bank (Lambarka akoonka: 38524624)',
  'Zaad / Sahal Service': 'Adeegga Zaad / Sahal', 'Opening Debt': 'Deynta furitaanka',
  'Salaam Somali Bank AccN: 38524624': 'Salaam Somali Bank Lambarka akoonka: 38524624',
  'Full Year Enterprise • $360/Year': 'Qorshaha ganacsiga sannadka oo dhan • $360/sannadkii',
  'Balance Due': 'Haraaga lagu leeyahay', 'SKU': 'SKU', 'Subtotal:': 'Wadarta qaybta:',
  'Discount:': 'Qiimo-dhimis:', 'Tax:': 'Canshuur:', 'Operator ID': 'Aqoonsiga shaqaalaha',
  'Item Name': 'Magaca shayga', 'Prev → New': 'Hore → Cusub',
  'NEXT-GEN ICT & RETAIL INTELLIGENCE': 'Tiknoolajiyadda iyo tafaariiqda casriga ah',
  'Maqsuud ICT': 'Maqsuud ICT', 'EVC Plus / Zaad / Sahal USSD Ready': 'USSD-ga EVC Plus / Zaad / Sahal waa diyaar',
  'ENCRYPTED OPERATOR TERMINAL': 'Nidaamka shaqaalaha ee sirgashan', 'Upload Photo File': 'Soo geli sawir',
  'Barcode Registered!': 'Barcode-ka waa la diiwaangeliyay!', 'Scan Barcode Now': 'Hadda sawir Barcode-ka',
  'Excel (.xlsx)': 'Excel (.xlsx)', 'Promise': 'Ballanqaad',
  'Report refresh failed: {loadError}': 'Cusboonaysiinta warbixintu way fashilantay: {loadError}',
  'Tax Amount ({effectiveTaxRatePct}%):': 'Qaddarka canshuurta ({effectiveTaxRatePct}%):',
  'Invoice #:': 'Lambarka qaansheegta:', 'Cashier:': 'Qasnajiga:',
  'Products Amount (Subtotal):': 'Wadarta badeecadaha:', 'Tax (Canshuur):': 'Canshuur:',
  'TOTAL AMOUNT (WADARTA):': 'WADARTA LACAGTA:', 'Recorded Amount (La Qabtay):': 'Qaddarka la helay:',
  'Due / Balance Remaining (Haraaga):': 'Deyn / haraaga lacagta:', 'Change to Return (Baaqiga):': 'Lacagta la celinayo:',
  'Zaad / Sahal': 'Zaad / Sahal', 'Supplier': 'Alaab-qeybiye',
  'Loading Maqsuud ICT intelligence...': 'Waxaa la soo rarayaa xogta Maqsuud ICT...',
  'Real-Time Enterprise Telemetry': 'La-socodka ganacsiga waqtiga-dhabta ah',
  'Live synchronized metrics from POS invoices, perpetual stock, and customer ledgers': 'Xog cusub oo laga helayo rasiidhada POS, kaydka, iyo xisaabaadka macaamiisha',
  'Chart period': 'Muddada jaantuska',
  'Sales Revenue': 'Dakhliga iibka', 'Net Profit': 'Faa’iidada saafiga ah',
  'No sales recorded yet.': 'Weli wax iib ah lama diiwaangelin.',
  'Recent POS Invoices': 'Rasiidhadii POS ee u dambeeyay', 'Recent Payments (Rasiid)': 'Lacag-bixinnadii u dambeeyay (Rasiid)',
  'Invoice #': 'Lambarka qaansheegta', 'Receipt #': 'Lambarka rasiidhka',
  'Customer': 'Macmiil', 'Amount': 'Qaddar', 'Status': 'Xaalad', 'Method': 'Habka', 'Paid': 'La bixiyay',
  'Products': 'Badeecadaha', 'Product': 'Badeecad', 'Product Name': 'Magaca badeecadda',
  'Product Photo & Details': 'Sawirka iyo faahfaahinta badeecadda', 'SKU / Barcode & QR': 'SKU / Barcode iyo QR',
  'Category': 'Qaybta', 'All Categories': 'Dhammaan qaybaha', 'Cost': 'Kharashka', 'Price': 'Qiimaha',
  'Stock': 'Kaydka', 'Available Stock': 'Kaydka la heli karo', 'Min Threshold': 'Xadka ugu yar',
  'Cost Price': 'Qiimaha soo iibsiga', 'Total Stock Value': 'Wadarta qiimaha kaydka', 'Actions': 'Tallaabooyinka',
  'Add Product': 'Ku dar badeecad', 'Add Customer': 'Ku dar macmiil', 'Add Category': 'Ku dar qayb',
  'Import CSV': 'Soo geli CSV', 'Export Excel': 'Soo saar Excel', 'Export PDF': 'Soo saar PDF',
  'Excel': 'Excel', 'PDF': 'PDF', 'Print': 'Daabac', 'Search': 'Raadi', 'Search...': 'Raadi...',
  'Filter': 'Kala shaandhee', 'All': 'Dhammaan', 'Save': 'Kaydi', 'Cancel': 'Jooji', 'Edit': 'Wax ka beddel',
  'Delete': 'Tirtir', 'Archive': 'Kaydi', 'View': 'Eeg', 'Close': 'Xir', 'Back': 'Dib u noqo',
  'Date': 'Taariikh', 'Type': 'Nooc', 'Description': 'Sharaxaad', 'Balance': 'Haraaga',
  'Subtotal': 'Wadarta qaybta', 'Total': 'Wadar', 'Total Amount': 'Wadarta lacagta', 'Total Cost': 'Wadarta kharashka',
  'Discount': 'Qiimo-dhimis', 'Tax': 'Canshuur', 'Quantity': 'Tirada', 'Qty': 'Tiro', 'Unit': 'Halbeeg',
  'Selling Price': 'Qiimaha iibka', 'Purchase Cost': 'Kharashka soo iibsiga', 'Payment Method': 'Habka lacag-bixinta',
  'Invoice Number': 'Lambarka qaansheegta', 'Customer ID': 'Aqoonsiga macmiilka', 'Full Name': 'Magaca oo buuxa',
  'Phone Number': 'Lambarka telefoonka', 'Phone': 'Telefoon', 'Email Address': 'Cinwaanka iimaylka',
  'Opening Bal': 'Haraaga furitaanka', 'Opening Balance': 'Haraaga furitaanka', 'Total Credit': 'Wadarta deynta',
  'Total Payments': 'Wadarta lacag-bixinnada', 'Total Paid': 'Wadarta la bixiyay', 'Current Balance': 'Haraaga hadda',
  'Outstanding Debt': 'Deyn harsan', 'Total Payments Received': 'Wadarta lacagaha la helay',
  'Customer Debts': 'Deymaha macaamiisha', 'Supplier Debts': 'Deymaha alaab-qeybiyeyaasha',
  'Customers': 'Macaamiisha', 'Suppliers': 'Alaab-qeybiyeyaasha', 'Purchases': 'Wax iibsiga',
  'Inventory & Stock': 'Alaabada iyo kaydka', 'Inventory Stock Levels': 'Heerarka kaydka alaabta',
  'Stock Movement Ledger': 'Diiwaanka dhaqdhaqaaqa kaydka', 'Movement Type': 'Nooca dhaqdhaqaaqa',
  'Timestamp': 'Waqtiga la diiwaangeliyay', 'Change': 'Isbeddel', 'Reason / Reference': 'Sabab / Tixraac',
  'User': 'Isticmaale', 'Action': 'Tallaabo', 'Stock Adjustment': 'Hagaajinta kaydka',
  'Low Stock Alerts': 'Digniinaha kaydka yar', 'Below minimum threshold': 'Ka hooseeya xadka ugu yar',
  'Urgent purchase replenishment needed': 'Dib-u-buuxinta kaydka ayaa degdeg loogu baahan yahay',
  'Valuation (Cost)': 'Qiimeyn (kharash)', 'Total invested capital in goods': 'Wadarta lacagta lagu maalgeliyay alaabta',
  'Valuation (Retail)': 'Qiimeyn (tafaariiq)', 'Expected revenue upon full sale': 'Dakhliga la filayo marka dhammaan la iibiyo',
  'Export Movements': 'Soo saar dhaqdhaqaaqyada', 'Record Stock Adjustment': 'Diiwaangeli hagaajinta kaydka',
  'Adjustment Type': 'Nooca hagaajinta', 'Physical Stock Count Correction': 'Sax tirinta kaydka dhabta ah',
  'Damaged / Broken Goods Write-off': 'Ka saar alaabta dhaawacantay ama jabtay', 'Expired Shelf Stock': 'Alaab dhacday',
  'Customer Returned Goods': 'Alaab uu macmiilku soo celiyay', 'Return to Supplier': 'Ku celi alaab-qeybiyaha',
  'Quantity Change (+ to add, - to subtract) *': 'Isbeddelka tirada (+ ku dar, - ka jar) *',
  'Reason / Audit Memo': 'Sababta / faahfaahinta diiwaanka', 'Updating...': 'Waa la cusboonaysiinayaa...',
  'Commit Adjustment': 'Xaqiiji hagaajinta', 'Operator': 'Shaqaale', 'Operators & Role-Based Access Control': 'Shaqaalaha iyo maamulka oggolaanshaha',
  'Full Administrator CRUD — create, view, edit credentials & roles, activate/deactivate, or delete staff accounts': 'Maamul buuxa — samee, eeg, wax ka beddel, hawlgeli ama tirtir akoonnada shaqaalaha',
  'Add Staff Operator': 'Ku dar shaqaale', 'Search operators by name, email, role, phone...': 'Ku raadi shaqaalaha magac, iimayl, door ama telefoon...',
  'Total Staff:': 'Wadarta shaqaalaha:', 'Staff Operator': 'Shaqaale', 'Assigned Role': 'Doorka loo xilsaaray',
  'Actions (CRUD)': 'Tallaabooyinka maamulka', 'Cashier': 'Qasnajiga', 'Store Manager': 'Maamulaha dukaanka',
  'Accountant': 'Xisaabiye', 'Administrator': 'Maamule', 'Role Permission': 'Oggolaanshaha doorka',
  'Operator Account Active (Can Sign In)': 'Akoonka shaqaaluhu wuu shaqaynayaa (wuu geli karaa)',
  'Save Changes': 'Kaydi isbeddellada', 'Create Operator': 'Samee akoon shaqaale', 'Edit Operator': 'Wax ka beddel shaqaalaha',
  'Account Status': 'Xaaladda akoonka', 'Created Date': 'Taariikhda la sameeyay',
  'POS Terminal': 'Meesha POS', 'Scan QR': 'Sawir QR', 'Scan products': 'Sawir badeecadaha',
  'Generate Labels': 'Samee summado', 'Stop Camera': 'Dami kamaradda', 'Start Camera': 'Daar kamaradda',
  'Optical Sensor Standby': 'Akhristaha kamaraddu waa diyaar', 'Scanned SKU Verified': 'SKU-ga la sawiray waa la xaqiijiyay',
  'Open in POS Terminal': 'Ka fur POS', 'No scans yet': 'Weli waxba lama sawirin',
  'Download PNG': 'Soo dejiso PNG', 'Print multiple sticky shelf price tags at once': 'Hal mar daabac summado badan oo qiimaha shelf-ka ah',
  'Generate All': 'Dhammaan samee', 'Print Sheet': 'Daabac xaashida',
  'No products match the selected filter': 'Ma jiraan badeecado waafaqa shaandhayntan',
  'Walk-in Retail Customer (Macmiil)': 'Macmiil toos ah (Macmiil)', 'Cash Sale (Kaash)': 'Iib lacag caddaan ah (Kaash)',
  'Credit / Debt (Deyn)': 'Iib deyn ah (Deyn)', 'Cart is Empty': 'Dambiishu waa madhan tahay',
  'Discount (Qiimo Dhimis):': 'Qiimo-dhimis:', 'Products Amount (Wadarta Badeecada):': 'Wadarta badeecadaha:',
  'Total Amount (Wadarta Guud):': 'Wadarta lacagta:', 'Complete Cash Sale': 'Dhammaystir iibka lacagta caddaanka ah',
  'Cash': 'Lacag caddaan ah', 'Payment Mode': 'Habka lacag-bixinta', 'Invoice total:': 'Wadarta qaansheegta:',
  'Create a sales invoice': 'Samee qaansheeg iib',
  'This submits a sale immediately: inventory is reduced and any unpaid balance is added to the customer ledger.': 'Tani isla markiiba waxay diiwaangelinaysaa iibka: kaydka waa laga jarayaa, deynta hartayna xisaabta macmiilka ayaa lagu darayaa.',
  'Select customer': 'Dooro macmiil', 'Select product': 'Dooro badeecad', 'Add item': 'Ku dar shay',
  'Add at least one product.': 'Ku dar ugu yaraan hal badeecad.', 'Item': 'Shay',
  'Grand Total:': 'Wadarta guud:', 'Amount Paid:': 'Qaddarka la bixiyay:', 'Balance Due:': 'Haraaga lagu leeyahay:',
  'Print / Download PDF': 'Daabac / Soo dejiso PDF', 'New Purchase Order': 'Dalab iibsi cusub',
  'PO Number': 'Lambarka dalabka iibsiga', 'Items': 'Shayada', 'Amount Paid': 'Qaddarka la bixiyay',
  'Stock Status': 'Xaaladda kaydka', 'In Inventory': 'Wuxuu ku jiraa kaydka',
  'Real-Time Barcode / QR Scanner Intake': 'Gelinta alaabta adigoo adeegsanaya Barcode / QR',
  'Camera Scan': 'Ku sawir kamaradda', 'PO Qty:': 'Tirada dalabka:', 'Product & Barcode': 'Badeecad iyo Barcode',
  'Cost Per Unit': 'Kharashka halkii xabbo', 'Remove': 'Ka saar', 'Total Purchase Cost:': 'Wadarta kharashka iibsiga:',
  'USB Laser Gun Active — Scan or Type Barcode:': 'Akhristaha USB-ga waa shaqaynayaa — sawir ama qor Barcode-ka:',
  'Use Code': 'Adeegso koodhka', 'Enable Sales Tax Calculation': 'Daar xisaabinta canshuurta iibka',
  'Enable Goods Insurance Rate': 'Daar heerka caymiska alaabta', 'Active License': 'Ruqsad shaqaynaysa',
  'High-contrast daytime clarity': 'Muuqaal cad oo maalintii ah',
  'TERMINAL AUTO-LOCKOUT ENFORCED (24H × 7 EXPIRED)': 'Nidaamku wuu xirmay (tijaabadii 7 maalmood way dhammaatay)',
  'Maqsuud ICT 3-Tier Enterprise Licensing': 'Ruqsadaha ganacsiga Maqsuud ICT — 3 heer',
  'Real-Time Server License & 24h × 7 Auto-Lockout Engine': 'Ruqsad server oo waqtiga-dhabta ah iyo xidhitaan otomaatig ah',
  'Initial 7-Day Trial Tier': 'Tijaabada 7-da maalmood ee bilowga ah', 'Current Active Plan': 'Qorshaha hadda shaqaynaya',
  'Billing Cycle:': 'Muddada biilka:', 'Active Trial • Day': 'Tijaabo shaqaynaysa • Maalinta',
  'Official Payment Gateways • WaafiPay, EVC Plus, Somtel & Salaam Somali Bank': 'Hababka lacag-bixinta rasmiga ah • WaafiPay, EVC Plus, Somtel iyo Salaam Somali Bank',
  'Dark Mode': 'Habka mugdiga', 'Light Mode': 'Habka iftiinka', 'Language': 'Luqadda', 'English': 'Ingiriisi', 'Soomaali': 'Soomaali',
  'Are you sure you want to deactivate? Only an authorized administrator can restore your access.': 'Ma hubtaa inaad joojinayso akoonka? Maamule la oggolaaday oo keliya ayaa dib kuu hawlgelin kara.',
  'Deactivate My Account': 'Jooji akoonkayga', 'Deactivating...': 'Waa la joojinayaa...', 'Yes, Deactivate': 'Haa, jooji',
  'Maqsuud ICT Support & Platform Architecture': 'Taageerada Maqsuud ICT iyo qaab-dhismeedka nidaamka',
  'Direct enterprise support channels and system specifications.': 'Kanaallada taageerada ganacsiga iyo tilmaamaha nidaamka.',
  'Official Maqsuud ICT Support & Billing': 'Taageerada iyo biilasha rasmiga ah ee Maqsuud ICT',
  'About Maqsuud ICT POS': 'Ku saabsan Maqsuud ICT POS',
  'Maqsuud ICT — Smart POS & Enterprise Management is a next-generation retail & wholesale intelligence platform engineered for electronics stores, supermarkets, and commercial distributors across East Africa.': 'Maqsuud ICT — Smart POS iyo Maamulka Ganacsiga waa madal casri ah oo loogu talagalay dukaamada elektaroonigga, suuqyada waaweyn, iyo qaybiyeyaasha ganacsiga ee Bariga Afrika.',
  'Logged out successfully': 'Si guul leh ayaad uga baxday', 'Network connection restored. Syncing data...': 'Xiriirka internetka waa soo noqday. Xogta waa la waafajinayaa...',
  'Working in offline mode. Changes saved locally.': 'Habka internet la’aanta ayaa shaqaynaya. Isbeddellada qalabka ayaa lagu kaydiyay.',
  'Terminal Auto-Locked: 7-Day (24h × 7) Trial expired. Upgrade to $30/mo or $360/yr to unlock.': 'Nidaamku si otomaatig ah ayuu u xirmay: tijaabadii 7-da maalmood way dhammaatay. Bixi qorshaha si aad u furto.',
  'All recorded Rasiid payments update customer accounts automatically': 'Dhammaan lacag-bixinnada Rasiid waxay si otomaatig ah u cusboonaysiiyaan akoonnada macaamiisha',
  'Min Debt:': 'Deynta ugu yar:', 'Debtor Name': 'Magaca qofka lagu leeyahay',
  'Record Payment': 'Diiwaangeli lacag-bixin', 'Export Statement PDF': 'Soo saar bayaanka PDF',
  'Supplier ID': 'Aqoonsiga alaab-qeybiyaha', 'Supplier Name': 'Magaca alaab-qeybiyaha', 'Company Name': 'Magaca shirkadda',
  'Contact Person': 'Qofka lala xiriirayo', 'Contact': 'Xiriir', 'Total Purchases': 'Wadarta wax iibsiga',
  'Balance (We Owe)': 'Haraaga aan ku leenahay', 'Amount We Owe': 'Qaddarka aan ku leenahay',
  'Export Statement': 'Soo saar bayaanka', 'Record Payment (Rasiid)': 'Diiwaangeli lacag-bixin (Rasiid)',
  'Total Credit Sales': 'Wadarta iibka deynta', 'Total Payments Made': 'Wadarta lacag-bixinnada la sameeyay',
  'Current Outstanding': 'Deynta hadda taagan', 'Transaction / Notes': 'Macaamil / Qoraallo',
  'Debit (+)': 'Deyn lagu daray (+)', 'Credit (-)': 'Lacag la bixiyay (-)', 'Running Balance': 'Haraaga socda',
  'Customer:': 'Macmiil:', 'Receipt #:': 'Lambarka rasiidhka:', 'Date:': 'Taariikh:', 'Method:': 'Habka:',
  'Reference:': 'Tixraac:', 'Previous Balance:': 'Haraagii hore:',
  'Remaining Balance:': 'Haraaga haray:', 'Print Rasiid': 'Daabac Rasiid', 'Vendor Ledger': 'Diiwaanka alaab-qeybiyaha',
  'Disburse Payment': 'Bixi lacag', 'Cash Voucher': 'Foojar lacag caddaan ah', 'Cash Office Voucher': 'Foojarka xafiiska lacagta',
  'Refresh': 'Cusboonaysii', 'Retry': 'Isku day mar kale', 'Total Sales': 'Wadarta iibka',
  'Cash Received': 'Lacagta la helay', 'Outstanding Credit': 'Deyn aan weli la bixin', 'Tax Collected': 'Canshuurta la ururiyay',
  'Refunded Invoices': 'Qaansheegyada lacagtooda la celiyay', 'Total Revenue': 'Wadarta dakhliga',
  'Cost of Goods Sold (COGS)': 'Kharashka badeecadaha la iibiyay (COGS)', 'Gross Profit': 'Faa’iidada guud',
  'Gross Margin %': 'Boqolkiiba faa’iidada guud', 'Potential Profit': 'Faa’iidada suurtagalka ah',
  'Low / Out of Stock': 'Kayd yar / dhammaaday', 'Customer Accounts': 'Akoonnada macaamiisha',
  'Total Receivables (Debts)': 'Wadarta lacagaha la sugayo (deymo)', 'Supplier Accounts': 'Akoonnada alaab-qeybiyeyaasha',
  'Total Accounts Payable': 'Wadarta lacagaha la bixinayo', 'Grand Total': 'Wadarta guud',
  'Units Sold': 'Tirada la iibiyay', 'Unit Cost': 'Kharashka halkii xabbo', 'COGS Total': 'Wadarta COGS',
  'Revenue': 'Dakhli', 'Margin %': 'Boqolkiiba faa’iidada',
  'SKU / QR': 'SKU / QR', 'Stock Valuation': 'Qiimeynta kaydka', 'Customer Name': 'Magaca macmiilka',
  'We Owe': 'Annaga ayaa lagu leeyahay', 'PO #': 'Lambarka dalabka iibka',
  'Add Supplier': 'Ku dar alaab-qeybiye', 'Download': 'Soo dejiso', 'Auto-Generate Barcode': 'Si otomaatig ah u samee Barcode',
  'None / General': 'Midna / Guud', 'Scan barcode / QR': 'Sawir Barcode / QR', 'Lookup': 'Raadi',
  'Sign In to Maqsuud POS': 'Gal Maqsuud POS', 'Operator Email Address': 'Iimaylka shaqaalaha',
  'Operator Password': 'Furaha sirta shaqaalaha', 'Launch Maqsuud POS Terminal': 'Fur nidaamka Maqsuud POS',
  'Enter your authorized operator credentials to access the enterprise terminal': 'Geli xogta gelitaanka shaqaalaha ee laguu oggolaaday si aad u isticmaasho nidaamka ganacsiga',
  'Unexpected token': 'Xog aan la filayn', 'Failed to fetch': 'Xogta lama soo heli karin',
  'No invoices found': 'Qaansheegyo lama helin', 'No data available': 'Xog lama hayo', 'No results found': 'Natiijo lama helin',
  'Create Invoice': 'Samee qaansheeg', 'Generate Invoice': 'Abuur qaansheeg', 'POS Invoices': 'Qaansheegyada POS',
  'General Invoices': 'Qaansheegyada guud', 'Reports Center': 'Xarunta warbixinnada', 'Sales Report': 'Warbixinta iibka',
  'Purchase Report': 'Warbixinta wax iibsiga', 'Inventory Report': 'Warbixinta kaydka',
  'COGS & Profit Report': 'Warbixinta COGS iyo faa’iidada', 'Customer Balance Report': 'Warbixinta haraaga macaamiisha',
  'Supplier Balance Report': 'Warbixinta haraaga alaab-qeybiyeyaasha', 'Users & Roles': 'Isticmaaleyaasha iyo doorarka',
  'Point of Sale (POS)': 'Goobta iibka (POS)', 'QR Code Scanner': 'Akhristaha QR Code', 'Dashboard': 'Dashboodhka',
  'Settings': 'Dejinta', 'Choose Your Plan': 'Dooro qorshahaaga', 'Add New': 'Ku dar cusub',
  'Log out': 'Ka bax', 'Logout': 'Ka bax', 'Profile': 'Astaanta isticmaalaha',
  'Search products by name, SKU, QR...': 'Ku raadi badeecad magac, SKU ama QR...',
  'No customers found': 'Macaamiil lama helin', 'No products found': 'Badeecado lama helin',
  'No suppliers found': 'Alaab-qeybiyeyaal lama helin', 'No invoices yet': 'Weli qaansheegyo ma jiraan',
  'Clear Cart': 'Faaruqi dambiisha', 'Complete Sale': 'Dhammaystir iibka', 'New Customer': 'Macmiil cusub',
  'Walk-in Customer': 'Macmiil toos ah', 'Cash Sale': 'Iib lacag caddaan ah', 'Credit Sale': 'Iib deyn ah',
  'Cash on Hand': 'Lacag caddaan ah oo la hayo', 'Paid in Full': 'Si buuxda ayaa loo bixiyay',
  'Partially Paid': 'Qayb ahaan ayaa loo bixiyay', 'Refunded': 'Lacag celin ayaa la sameeyay',
  'Pending': 'Sugaya', 'Completed': 'Dhammaystiran', 'Active': 'Shaqaynaya', 'Inactive': 'Aan shaqaynayn',
  'Enable': 'Daar', 'Disable': 'Dami', 'Update': 'Cusboonaysii', 'Create': 'Samee', 'Submit': 'Gudbi',
  'Confirm': 'Xaqiiji', 'Yes': 'Haa', 'No': 'Maya', 'Name': 'Magac', 'Role': 'Door', 'Notes': 'Qoraallo',
  'Address': 'Cinwaan', 'Email': 'Iimayl', 'Password': 'Furaha sirta', 'New Password': 'Furaha sirta cusub',
  'Show password': 'Muuji furaha sirta', 'Hide password': 'Qari furaha sirta', 'Required': 'Waa waajib',
  'Loading...': 'Waa la soo rarayaa...', 'Saving...': 'Waa la kaydinayaa...', 'Processing...': 'Waa la farsamaynayaa...',
  'Failed to load data': 'Soo raridda xogta way fashilantay', 'Something went wrong': 'Waxbaa khaldamay',
  'No records found': 'Diiwaanno lama helin', 'No transactions found': 'Macaamillo lama helin',
  'Today': 'Maanta', 'Week': 'Toddobaad', 'Month': 'Bil', 'Year': 'Sannad',
  'Day': 'Maalin', 'Last 7 days': '7-dii maalmood ee u dambeeyay', 'Last 30 days': '30-kii maalmood ee u dambeeyay',
  'Start Date': 'Taariikhda bilowga', 'End Date': 'Taariikhda dhammaadka', 'From': 'Laga bilaabo', 'To': 'Ilaa',
  'Payment': 'Lacag-bixin', 'Payments': 'Lacag-bixinnada', 'Sales': 'Iibka', 'Report': 'Warbixin', 'Reports': 'Warbixinnada',
  'Invoice': 'Qaansheeg', 'Invoices': 'Qaansheegyo', 'Purchase Order': 'Dalabka wax iibsiga',
  'Customer Details': 'Faahfaahinta macmiilka', 'Supplier Details': 'Faahfaahinta alaab-qeybiyaha',
  'Product Details': 'Faahfaahinta badeecadda', 'Category Name': 'Magaca qaybta',
  'Edit Customer': 'Wax ka beddel macmiilka', 'Edit Product': 'Wax ka beddel badeecadda',
  'Edit Supplier': 'Wax ka beddel alaab-qeybiyaha', 'Confirm Delete': 'Xaqiiji tirtiridda',
  'Are you sure?': 'Ma hubtaa?', 'This action cannot be undone.': 'Tallaabadan dib looma celin karo.',
  'Customer added successfully': 'Macmiilka si guul leh ayaa loo daray', 'Product added successfully': 'Badeecadda si guul leh ayaa loo dartay',
  'Invoice created successfully': 'Qaansheegta si guul leh ayaa loo sameeyay', 'Payment recorded successfully': 'Lacag-bixinta si guul leh ayaa loo diiwaangeliyay',
};

const reverse = new Map(Object.entries(somali).map(([english, translated]) => [translated, english]));
const textState = new WeakMap<Text, { source: string; rendered: string }>();
const attributeState = new WeakMap<Element, Map<string, { source: string; rendered: string }>>();

export function localizeMountedUi(language: Language): () => void {
  const translateValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return value;
    let localized = language === 'so' ? (somali[trimmed] ?? trimmed) : (reverse.get(trimmed) ?? trimmed);
    if (language === 'so' && localized === trimmed) {
      const prefix = Object.keys(somali).filter((key) => key.endsWith(':') && trimmed.startsWith(key)).sort((a, b) => b.length - a.length)[0];
      if (prefix) localized = `${somali[prefix]}${trimmed.slice(prefix.length)}`;
      else if (trimmed.startsWith('Active Trial • Day ')) localized = `Tijaabo shaqaynaysa • Maalinta ${trimmed.slice('Active Trial • Day '.length)}`;
      else if (trimmed.startsWith('Report refresh failed: ')) localized = `Cusboonaysiinta warbixintu way fashilantay: ${trimmed.slice('Report refresh failed: '.length)}`;
    }
    if (localized === trimmed) return value;
    const leading = value.match(/^\s*/)?.[0] ?? '';
    const trailing = value.match(/\s*$/)?.[0] ?? '';
    return `${leading}${localized}${trailing}`;
  };
  const translateNode = (node: Text) => {
    const current = node.nodeValue || '';
    const previous = textState.get(node);
    const source = previous && current === previous.rendered
      ? previous.source
      : (language === 'en' ? (reverse.get(current.trim()) ?? current) : current);
    const rendered = translateValue(source);
    if (rendered !== current) node.nodeValue = rendered;
    textState.set(node, { source, rendered });
  };
  const translateAttribute = (element: Element, attr: string) => {
    const current = element.getAttribute(attr);
    if (!current) return;
    const attributes = attributeState.get(element) || new Map<string, { source: string; rendered: string }>();
    const previous = attributes.get(attr);
    const source = previous && current === previous.rendered
      ? previous.source
      : (language === 'en' ? (reverse.get(current.trim()) ?? current) : current);
    const rendered = translateValue(source);
    if (rendered !== current) element.setAttribute(attr, rendered);
    attributes.set(attr, { source, rendered });
    attributeState.set(element, attributes);
  };
  const skipped = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'SVG']);
  const visit = (root: Node) => {
    if (root instanceof Text) {
      if (root.parentElement && !skipped.has(root.parentElement.tagName)) {
        translateNode(root);
      }
      return;
    }
    if (root instanceof Element && skipped.has(root.tagName)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.parentElement && skipped.has(node.parentElement.tagName)) continue;
      translateNode(node as Text);
    }
    if (root instanceof Element) {
      for (const attr of ['placeholder', 'title', 'aria-label', 'alt']) {
        const value = root.getAttribute(attr);
        if (value) translateAttribute(root, attr);
      }
      root.querySelectorAll('[placeholder], [title], [aria-label], [alt]').forEach((element) => {
        for (const attr of ['placeholder', 'title', 'aria-label', 'alt']) {
          const value = element.getAttribute(attr);
          if (value) translateAttribute(element, attr);
        }
      });
    }
  };
  visit(document.body);
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData' && mutation.target instanceof Text) {
        translateNode(mutation.target);
      }
      mutation.addedNodes.forEach(visit);
      if (mutation.type === 'attributes' && mutation.target instanceof Element) visit(mutation.target);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label', 'alt'] });
  return () => observer.disconnect();
}
