# Bedrock Playground

Bedrock Playground is a powerful tool designed to help developers and AI enthusiasts explore and compare Amazon Bedrock's Large Language Models (LLMs). Key features include:

- Model Comparison: Evaluate and compare the speed, performance, and cost of different Bedrock LLM models side by side.
- Image Generation: Utilize Bedrock's image generation capabilities to create and compare visual outputs across models.
- Prompt Creation and Editing: Craft, refine, and experiment with prompts to optimize model responses.
- Interactive Interface: Easily interact with models, visualize results, and analyze performance metrics in real-time.

**Note:** Bedrock Playground is currently under active development, please be aware that:

- Some features may be incomplete or subject to change.
- Bugs or unexpected behavior may be present.
- Performance optimizations are ongoing.

We appreciate your patience and welcome any feedback or bug reports to help improve the project. Please use the issue tracker on our GitHub repository to report any problems or suggest enhancements.

## Table of Contents

1. [Requirements](#requirements)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Technologies Used](#technologies-used)
5. [Contributing](#contributing)
6. [License](#license)

## Requirements

Before you begin, ensure you have the following:

1. An AWS account: If you don't have one, [create a new AWS account](https://aws.amazon.com/resources/create-account/).

2. AWS credentials:

   - Create an IAM user with programmatic access.
   - Attach the necessary permissions for Bedrock. At minimum, you'll need:
     - `BedrockFullAccess`
   - Generate and securely store the Access Key ID and Secret Access Key. These will be used in the `.env.local` file.

3. AWS CLI installed and configured (optional but recommended).

4. Bedrock model access:

   - Log in to the AWS Console and navigate to the Bedrock service.
   - Request access to the models you intend to use. This typically includes:
     - AI21 Labs models
     - Anthropic models
     - Amazon Titan models
     - Stability AI models
     - Mistral models
     - Meta Llama models
   - Note that model availability may vary by region. Ensure you request access in the region(s) you plan to use.
   - Access requests may take 1-2 business days to process.

5. Verify your account limits and request increases if necessary.

By ensuring these requirements are met, you'll be fully prepared to use all features of the Bedrock Playground.

## Getting Started

Follow these steps to set up the Bedrock Playground on your local machine:

1. Clone the repository:

   ```
   git clone https://github.com/your-username/bedrock-playground.git
   cd bedrock-playground
   ```

2. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following variables:

   ```
   # Required variables
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=your_aws_region

   # Optional variables

   # include if you plan to use OpenAI or NVIDIA NIM
   OPENAI_API_KEY=your_openai_api_key
   NVIDIA_NIM_API_KEY=your_nvidia_nim_api_key

   # include if you want to use rate limiting with upstash and vercel KV
   KV_URL=your_kv_store_url
   KV_REST_API_URL=your_kv_rest_api_url
   KV_REST_API_TOKEN=your_kv_rest_api_token
   KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
   ```

   Replace the placeholder values with your actual credentials. The optional variables can be added if you plan to use OpenAI, NVIDIA NIM, or KV store features.

3. Install dependencies:

   ```
   npm install
   ```

4. Run the development server:

   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The project follows a typical Next.js structure with some custom organization:

- `src/`: Contains the main source code
  - `app/`: Next.js app router and page components
  - `components/`: Reusable React components
  - `lib/`: Utility functions and model configurations
  - `stores/`: Zustand stores for state management
  - `types/`: TypeScript type definitions
- `public/`: Static assets and images
- `styles/`: Global CSS styles

## Technologies Used

- [Next.js](https://nextjs.org/): React framework for building the application
- [React](https://reactjs.org/): JavaScript library for building user interfaces
- [TypeScript](https://www.typescriptlang.org/): Typed superset of JavaScript
- [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework
- [Shadcn](https://ui.shadcn.com/): UI components
- [Clerk](https://clerk.com/): Authentication and user management
- [Zustand](https://github.com/pmndrs/zustand): State management library
- [React Query](https://tanstack.com/query/latest): Data fetching and caching library
- [Recharts](https://recharts.org/): Charting library for React

## Contributing

Contributions to the Bedrock Playground project are welcome. Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them with descriptive commit messages
4. Push your changes to your fork
5. Submit a pull request to the main repository

Please ensure that your code follows the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License:

MIT License

Copyright (c) 2024 Caylent

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
