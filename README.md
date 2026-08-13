# Online Shopping Management System

Welcome to the Online Shopping Management System repository! This is a modern, full-stack e-commerce application built with Next.js and MongoDB.

## Live Demo
🔗 **[Live Deployment on Vercel](https://online-shopping-mocha-six.vercel.app)**

## Tech Stack
- **Framework:** Next.js (App Router, v16)
- **UI Library:** React (v19)
- **Styling:** Tailwind CSS (v4)
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** NextAuth.js (v5 beta)
- **Security:** bcryptjs
- **Email Service:** nodemailer
- **Icons:** lucide-react

## Features Implemented
- **User Authentication:** Robust authentication system with Sign Up, Sign In, and secure session management.
- **Email Verification:** Account verification via email to ensure valid users.
- **Password Management:** Forgot password and secure reset password flows.
- **Product Catalog:** Browse and view comprehensive product listings.
- **Categories:** Organize products by category for easy navigation.
- **Product Details:** Dedicated product pages with specific item information.
- **Reviews & Ratings:** Users can leave and view reviews for products.
- **Wishlist:** Users can add their favorite items to a personalized wishlist.
- **Shopping Cart & Checkout:** Seamless user flow from cart to checkout.
- **User Profile:** Manage user details and view personal activity.

## User Flow
1. **Onboarding:** A user can register via the `/signup` page and will receive a verification email.
2. **Verification:** The user verifies their account via the `/verify` page using the received code.
3. **Authentication:** The user logs in via the `/signin` page. If they forget their password, they can use `/forgot-password` to receive a reset code and proceed to `/reset-password`.
4. **Browsing:** Users can explore products on the home page, browse by `/categories`, or view the full list at `/products`.
5. **Product Interaction:** Selecting a product takes the user to its detail page (`/products/[id]`), where they can read reviews and add the item to their cart or wishlist.
6. **Wishlist:** Users can view and manage their saved items on the `/wishlist` page.
7. **Checkout:** Users can proceed to `/checkout` to finalize their purchase.
8. **Profile Management:** Users can view and update their personal information via the `/profile` page.

## APIs Connected
The application uses the following internal Next.js API routes:

**Auth & User Management:**
- `/api/auth/[...nextauth]` - NextAuth authentication endpoints (Session management)
- `/api/auth/signup` - User registration
- `/api/auth/verify` - Account email verification
- `/api/auth/forgot-password` - Trigger password reset email
- `/api/auth/reset-password` - Process password reset
- `/api/auth/resend-code` - Resend verification/reset codes
- `/api/profile` - User profile data operations

**E-commerce Core:**
- `/api/categories` - Fetch and manage product categories
- `/api/products` - Fetch and manage products
- `/api/reviews` - Product reviews and ratings
- `/api/wishlist` - Manage user wishlist items
