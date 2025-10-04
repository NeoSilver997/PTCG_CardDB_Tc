from playwright.sync_api import sync_playwright, Page, expect

def verify_frontend(page: Page):
    """
    This script verifies that the main page of the PTCG Web application loads correctly,
    displays cards, and that filtering works as expected with the new backend.
    """
    # 1. Navigate to the application
    page.goto("http://localhost:3000")

    # 2. Wait for the initial cards to be visible
    # We'll wait for a specific card to appear to confirm the API call was successful
    expect(page.get_by_text("Pikachu")).to_be_visible(timeout=20000)
    expect(page.get_by_text("Charizard")).to_be_visible()

    # 3. Take a screenshot of the initial loaded state
    page.screenshot(path="jules-scratch/verification/01_initial_load.png")

    # 4. Apply a filter
    # We will filter by rarity. The 'Rare' option comes from our mocked filters API.
    rarity_filter = page.get_by_label("Rarity")
    rarity_filter.select_option(label='Rare')

    # 5. Wait for the page to update with the filtered results.
    # The URL should now contain the rarity filter parameter.
    expect(page).to_have_url(lambda url: 'rarity=Rare' in url, timeout=10000)

    # 6. Take a screenshot of the filtered state
    page.screenshot(path="jules-scratch/verification/verification.png") # Final screenshot

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_frontend(page)
        browser.close()

if __name__ == "__main__":
    main()