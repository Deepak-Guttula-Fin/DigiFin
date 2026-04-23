# DigiFin - Personal Finance Management System

A modern, dark-themed personal finance management application built with vanilla JavaScript, HTML, and CSS. Track income, expenses, investments, and get comprehensive analytics of your financial health.

## 🚀 Features

### Core Functionality
- **Transaction Management**: Add, edit, and delete income, expenses, and investment transactions
- **Investment Tracking**: Monitor Shares, SIP, and Asset Savings with buy/sell transactions
- **Financial Analytics**: Comprehensive needs/wants/savings analysis with visual charts
- **Budget Management**: Set and track monthly budgets with alerts
- **Data Visualization**: Interactive charts for spending patterns and investment performance

### User Interface
- **Dark Theme**: Modern dark terminal aesthetic with neo-brutalist accents
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **User Profiles**: Personalized experience with custom avatars and settings
- **Export Functionality**: Generate comprehensive PDF reports with all financial data

### Advanced Features
- **Cumulative Balance Tracking**: See running totals in monthly and daily ledgers
- **Multi-format Image Support**: Upload avatars in TIFF, JPEG, GIF, PNG, WebP, HEIF, AVIF, BMP, EPS, RAW
- **Local Data Storage**: All data stored locally in browser for privacy
- **Comprehensive Reports**: PDF exports with profile, analytics, and detailed tables

## 📊 Sections

### 1. Dashboard
- Financial overview with key metrics
- Recent transactions
- Budget alerts
- Reminders widget

### 2. Analytics
- Needs vs Wants vs Savings breakdown
- Investment performance charts
- Spending patterns analysis
- Category-wise expense distribution

### 3. Data Center
- Monthly Summary table with cumulative balances
- Daily Ledger with running totals
- Transaction history with filters
- Export options (PDF, CSV)

### 4. Settings
- Profile management
- Avatar customization
- Data backup/restore
- Sign out functionality

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Charts**: Chart.js for data visualization
- **PDF Generation**: jsPDF with html2canvas
- **Storage**: LocalStorage for data persistence
- **Icons**: Font Awesome for UI icons

## 📁 Project Structure

```
DigiFin/
├── index.html          # Main application file
├── styles.css          # Complete styling with dark theme
├── script.js           # All application logic
├── README.md           # Project documentation
└── .gitignore          # Git ignore file
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DigiFin
   ```

2. **Open the application**
   - Simply open `index.html` in your web browser
   - No server setup required - runs entirely in the browser

3. **Set up your profile**
   - Enter your name, age, gender, email, and budget
   - Choose your character/avatar
   - Start adding transactions

## 💾 Data Storage

All data is stored locally in your browser using LocalStorage:
- **Profile Information**: Name, email, budget, preferences
- **Transactions**: All income, expense, and investment records
- **Settings**: User preferences and customizations

*Note: Data is stored locally and not synced to any server. Clearing browser data will remove all stored information.*

## 📈 Reports & Export

### PDF Reports
Generate comprehensive PDF reports including:
- User profile and financial summary
- Analytics breakdown (needs/wants/savings)
- Monthly summary table with cumulative balances
- Daily ledger with running totals
- Recent transactions

### Features
- **Professional Formatting**: Dark theme matching web interface
- **Complete Data**: All financial information in one document
- **Visual Elements**: Card-based layout with color coding
- **Export Options**: Download as PDF or CSV

## 🎨 Design System

### Color Palette
- **Background**: Dark terminal theme (#0a0c10)
- **Primary**: Teal (#00e5a0)
- **Secondary**: Coral (#ff6b6b)
- **Accent**: Amber (#f5a623), Purple (#9b6dff), Blue (#4d9fff)

### Typography
- **UI Font**: Syne (sans-serif)
- **Monospace**: Space Mono
- **Hierarchy**: Clear visual hierarchy with proper sizing

## 🔧 Customization

### Adding New Categories
Modify the `categoryMapping` object in `script.js` to add new expense categories:

```javascript
const categoryMapping = {
  needs: ['Home', 'Mobile', 'Health', 'Education'],
  wants: ['Travel', 'Entertainment', 'Food'],
  // Add your custom categories here
};
```

### Custom Styling
All styles are contained in `styles.css` with CSS variables for easy customization:

```css
:root {
  --teal: #00e5a0;
  --coral: #ff6b6b;
  --bg-base: #0a0c10;
  /* Modify colors as needed */
}
```

## 📱 Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Chart.js** for beautiful data visualization
- **jsPDF** for PDF generation capabilities
- **Font Awesome** for iconography
- **Google Fonts** for typography

---

**DigiFin** - Your personal finance companion for better financial health. 💰📊
