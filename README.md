# Mailgun Transactional Email Workflow Demo

A shopping cart application with Mailgun integration for sending order confirmation emails.

## Features

- Shopping cart UI with product management
- Order confirmation workflow
- Mailgun integration for transactional emails
- Responsive design

## Prerequisites

- Node.js (v16+ recommended)
- Mailgun account with API credentials

## How to Run This Code

### Backend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with your Mailgun credentials:
   ```
   MAILGUN_API_KEY=your_api_key
   MAILGUN_DOMAIN=your_mailgun_domain
   PORT=8080
   ```

3. Start the server:
   ```bash
   node src/server.js
   ```

### UI Preview

To preview the UI, you have two options:

1. Open the `ui/index.html` file directly in your browser
2. Or run a local server with Python:
   ```bash
   python3 -m http.server -d=./ui
   ```
   Then visit `http://localhost:8000/` in your browser

## Project Structure

```
draftdev-mailgunner/
├── LICENSE
├── README.md
├── package.json
├── src/
│   └── server.js         # Backend server with Mailgun integration
└── ui/
    └── index.html        # Shopping cart UI
```

## Configuration

Update the API endpoint in `ui/index.html` if your backend runs on a different port:

```javascript
const api = "http://localhost:8080/"; // Change this to match your backend URL
```

## License

MIT License - See [LICENSE](LICENSE) for details.
