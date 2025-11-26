// Email Verification Success Page
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // Get query params
  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'verification';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verified - TipGenius</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%);
      color: #FFFFFF;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      max-width: 500px;
      width: 100%;
      background: rgba(26, 31, 58, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 48px 32px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    .icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 40px;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
    }

    h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #6366F1 0%, #818CF8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    p {
      font-size: 16px;
      line-height: 24px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 32px;
    }

    .opening-text {
      font-size: 18px;
      font-weight: 600;
      color: #6366F1;
      margin-bottom: 16px;
    }

    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
      color: #FFFFFF;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      margin: 8px;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.6);
    }

    .button-secondary {
      background: rgba(99, 102, 241, 0.1);
      border: 2px solid #6366F1;
      box-shadow: none;
    }

    .button-secondary:hover {
      background: rgba(99, 102, 241, 0.2);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .store-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 24px;
    }

    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
    }

    @media (max-width: 480px) {
      .container {
        padding: 32px 24px;
      }

      h1 {
        font-size: 28px;
      }

      .button {
        display: block;
        margin: 8px 0;
      }
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: #FFFFFF;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: 8px;
      vertical-align: middle;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✓</div>
    <h1>Email Verified!</h1>
    <p id="status-text" class="opening-text">
      <span class="spinner"></span>
      Opening TipGenius...
    </p>
    <p>Your email has been successfully verified. You now have access to all premium features including tax exports, advanced analytics, and team pooling.</p>

    <a href="tipgenius://verify-success" class="button" id="open-app-btn">
      Open TipGenius App
    </a>

    <div class="store-buttons" id="store-buttons" style="display: none;">
      <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 8px;">Don't have the app yet?</p>
      <a href="https://apps.apple.com/app/tipgenius" class="button button-secondary">
        Download on App Store
      </a>
      <a href="https://play.google.com/store/apps/details?id=com.tipgenius.app" class="button button-secondary">
        Get it on Google Play
      </a>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} TipGenius • Track smarter, earn better</p>
    </div>
  </div>

  <script>
    // Try to open the app automatically
    let appOpened = false;

    function tryOpenApp() {
      if (!appOpened) {
        window.location.href = 'tipgenius://verify-success';
        appOpened = true;

        // After 2 seconds, show store buttons if app didn't open
        setTimeout(() => {
          document.getElementById('status-text').textContent = "Couldn't open the app?";
          document.getElementById('store-buttons').style.display = 'block';
        }, 2000);
      }
    }

    // Try opening immediately
    tryOpenApp();

    // Handle manual button click
    document.getElementById('open-app-btn').addEventListener('click', (e) => {
      e.preventDefault();
      tryOpenApp();
    });

    // Detect if user returns to tab (app didn't open)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && appOpened) {
        setTimeout(() => {
          document.getElementById('status-text').textContent = "Couldn't open the app?";
          document.getElementById('store-buttons').style.display = 'block';
        }, 500);
      }
    });
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
});
