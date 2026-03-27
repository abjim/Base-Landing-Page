# Nano Banana Masterclass - Update Instructions (v9.4)

## 1. Database Schema Update (CRITICAL)

To enable the new User Dashboard features (Profile, Reading Progress, Cover Images), you must update your database schema.

**Steps:**
1. Log in to the **Admin Dashboard**.
2. Go to the **Settings** tab.
3. Click the **"Fix Database Schema & Migrate Users"** button.

**What this does:**
- Creates the `reading_progress` table to store user reading history.
- Creates the `product_metadata` table to store cover images and descriptions.
- Adds a `phone` column to the `users` table.
- Inserts default metadata for the main eBook.

## 2. User Dashboard Features

### Profile Management
- Users can now update their **Email**, **Phone Number**, and **Password** from the "Profile" tab in their dashboard.
- Changing the email address will automatically log the user out and require them to log in again with the new email.

### PDF Reader & Progress
- The new PDF reader supports **Dark**, **Light**, and **Sepia** themes.
- Reading progress (current page) is saved automatically.
- Users can resume reading from any device.

### Library Display
- The library now displays cover images for books.
- Default cover images are provided. To update them, you will need to manually update the `product_metadata` table in your database (or request a feature to manage this from the admin panel in the future).

## 3. Troubleshooting

- **"Profile update failed"**: Ensure the email address is not already in use by another user.
- **"Cover image not showing"**: Run the "Fix Database Schema" tool again to ensure the metadata table is created and populated.
