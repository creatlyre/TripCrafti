from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Navigate to the login page
    page.goto("http://localhost:4321/login")

    # Fill in the email and password
    page.get_by_label("Email").fill("test@example.com")
    page.get_by_label("Password").fill("password")

    # Click the sign-in button
    page.get_by_role("button", name="Sign in").click()

    # Wait for navigation to the dashboard
    page.wait_for_url("http://localhost:4321/app?lang=en")

    # Take a screenshot of the dashboard
    page.screenshot(path="jules-scratch/verification/dashboard.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)