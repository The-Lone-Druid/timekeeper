# Contributing to TimeKeeper

Thank you for your interest in contributing to TimeKeeper! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## How to Contribute

### 1. Reporting Issues

- Check if the issue has already been reported
- Use a clear and descriptive title
- Include steps to reproduce the issue
- Provide expected and actual behavior
- Add screenshots if applicable
- Include your browser and OS information

### 2. Feature Requests

- Use a clear and descriptive title
- Explain why this feature would be useful
- Provide examples of how the feature would work
- Consider suggesting implementation approaches

### 3. Pull Requests

1. **Fork the Repository**

   ```bash
   git clone https://github.com/yourusername/timekeeper.git
   cd timekeeper
   ```
2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Install Dependencies**

   ```bash
   pnpm install
   ```
4. **Make Your Changes**

   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed
5. **Commit Your Changes**

   ```bash
   git commit -m "feat: add your feature description"
   ```
6. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

   - Use a clear title and description
   - Reference any related issues
   - Wait for review and feedback

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing

- Add tests for new features
- Ensure all tests pass before submitting
- Update tests when modifying existing features

### Documentation

- Update README.md for significant changes
- Add comments for complex code
- Document new features and APIs

## Project Structure

```
timekeeper/
├── src/
│   ├── time-tracker.ts    # Main component
│   └── index.html         # Entry point
├── public/
│   └── vite.svg          # Assets
├── package.json          # Dependencies (including xlsx)
├── tsconfig.json         # TypeScript config
└── vite.config.ts        # Vite config
```

## Getting Help

- Open an issue for questions
- Join our community chat (if available)
- Check the existing documentation

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

Thank you for contributing to TimeKeeper! 🚀
