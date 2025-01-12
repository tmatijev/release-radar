# Release Radar 🎬 📺

A Chrome extension that helps you track release dates for movies and TV series. Get notified when new episodes or movies you're interested in are released!

## Features

- 🔍 Search for upcoming movies and TV shows
- 🔔 Get notifications for new releases
- 📅 Track release dates for your favorite content
- 🔐 Secure Google Sign-in
- 🎯 Focus on upcoming/ongoing content only
- 🖼️ Beautiful and intuitive UI

## Setup

### Prerequisites

- Node.js (latest LTS version recommended)
- Chrome browser
- TMDB API key
- Google OAuth Client ID

### Getting API Keys

1. **TMDB API Key**:
   - Sign up at [TMDB](https://www.themoviedb.org/signup)
   - Go to your account settings
   - Navigate to the API section
   - Create a new API key (v3 auth)

2. **Google OAuth Client ID**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Calendar API
   - Configure the OAuth consent screen
   - Create credentials (OAuth client ID)
   - Select "Chrome Extension" as application type
   - Add your extension ID to the allowed origins

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/release-radar.git
   cd release-radar
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Add your API keys to `.env`:
   ```
   VITE_TMDB_API_KEY=your_tmdb_api_key_here
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

5. Build the extension:
   ```bash
   npm run build
   ```

6. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from your project

## Development

- Run development build with watch mode:
  ```bash
  npm run watch
  ```
- The extension will automatically rebuild when you make changes
- Refresh the extension in Chrome to see your changes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security

- Never commit your `.env` file
- Keep your API keys private
- Report security vulnerabilities by opening an issue

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [TMDB](https://www.themoviedb.org/) for their excellent API
- [Google Calendar API](https://developers.google.com/calendar) for authentication
- All contributors who help improve this project 