# HealthTrackIoT

A full-stack IoT health tracking application built with React, Express, and TypeScript.

## 🚀 Features

- Real-time health data monitoring
- Modern UI with Radix UI components
- Type-safe development with TypeScript
- Responsive design with Tailwind CSS
- Secure authentication system
- Real-time data visualization with Recharts
- Database integration with Drizzle ORM

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Development Tools**: Vite, ESBuild
- **State Management**: React Query
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom animations
- **Real-time Features**: WebSocket support

## 📋 Prerequisites

- Node.js (latest LTS version recommended)
- PostgreSQL database
- npm or yarn package manager

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd HealthTrackIoT
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Create a `.env` file in the root directory
   - Add your database connection string and other necessary environment variables

4. Initialize the database:
   ```bash
   npm run db:push
   ```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

This will start:
- The Express server on port 5000
- Vite development server with hot module reloading
- WebSocket server for real-time features

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
HealthTrackIoT/
├── client/           # Frontend React application
├── server/           # Backend Express server
├── shared/           # Shared code between frontend and backend
├── migrations/       # Database migrations
├── attached_assets/  # Static assets
└── ...
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

## 🔒 Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=your_postgres_connection_string
NODE_ENV=development
# Add other environment variables as needed
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Drizzle ORM](https://orm.drizzle.team/) for database operations
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vite](https://vitejs.dev/) for build tooling 
