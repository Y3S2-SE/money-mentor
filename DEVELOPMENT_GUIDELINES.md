##  Commit Message Standards

### Types
- **feat**: A new feature
  - Example: `feat: add user registration endpoint`
  - Example: `feat: implement savings goal dashboard`

- **fix**: A bug fix
  - Example: `fix: resolve MongoDB connection timeout issue`
  - Example: `fix: correct validation error in login form`

- **docs**: Documentation only changes
  - Example: `docs: update API documentation`
  - Example: `docs: add setup instructions to README`

- **style**: Code style changes (formatting, missing semicolons, etc.)
  - Example: `style: format code with prettier`
  - Example: `style: fix indentation in user controller`

- **test**: Adding or updating tests
  - Example: `test: add unit tests for user service`
  - Example: `test: add integration tests for auth endpoints`

- **chore**: Changes to build process or auxiliary tools
  - Example: `chore: update dependencies`
  - Example: `chore: configure ESLint`


✅ **DO:**
- Use present tense: "add feature" not "added feature"
- Be specific and descriptive
- Keep the subject line under 50 characters
- Reference issue numbers when applicable: `feat: add login endpoint (#12)`
- Use lowercase for the subject line

❌ **DON'T:**
- Use vague messages like "fix bug" or "update code"
- End subject line with a period
- Write overly long subject lines

## Branch Naming Convention

### Format
```
<type>/<short-description>
```
### Example

- feature/user-authentication

##  Git Workflow

1. **Create feature branch from Main branch**
```bash
   git checkout -b feature/your-feature-name
```

2. **Make changes and commit regularly**
```bash
   git add .
   git commit -m "feat: add user registration endpoint"
```

3. **Push to remote**
```bash
   git push origin feature/your-feature-name
```

4. **Create Pull Request on GitHub**
   - Request review from at least one team member
   - Address review comments
   - Merge after approval