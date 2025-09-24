import os
import google.generativeai as genai
from dotenv import load_dotenv

def test_api_key():
    """
    A simple function to test if the Gemini API key is working.
    """
    try:
        # 1. Load the API key from the .env file
        print("🔎 Attempting to load API key from .env file...")
        load_dotenv()
        api_key = os.getenv("GOOGLE_API_KEY")

        if not api_key:
            print("❌ ERROR: GOOGLE_API_KEY not found in .env file.")
            return

        # 2. Configure the Gemini client
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash") # Using a standard, reliable model for the test

        # 3. Send a simple test prompt
        print("✅ Key loaded. Sending a test prompt to Gemini...")
        response = model.generate_content("Hello!")

        # 4. Check for a valid response
        if response.text:
            print("\n🎉 SUCCESS! Your API key is working correctly.")
            print("-" * 20)
            print(f"Gemini's Response: {response.text.strip()}")
            print("-" * 20)
        else:
            print("⚠️ WARNING: Request went through, but got an empty response.")

    except Exception as e:
        print("\n❌ ERROR: The API key test failed.")
        print("Check the error message below for clues.")
        print(f"Error Details: {e}")

# Run the test function
if __name__ == "__main__":
    test_api_key()
