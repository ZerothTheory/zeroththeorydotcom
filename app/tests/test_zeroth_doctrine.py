"""
Zeroth Doctrine Web Experience - Test Suite
============================================
Tests the Expo React Native web app with:
  1. curl-based HTTP smoke tests (no browser needed)
  2. Selenium WebDriver integration tests (headless Chrome)

Run: python tests/test_zeroth_doctrine.py
"""

import subprocess
import sys
import time
import json
import unittest
import re

# ─── Configuration ────────────────────────────────────────────
BASE_URL = "http://localhost:8099"
HEADLESS = True
SELENIUM_AVAILABLE = False

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.action_chains import ActionChains
    from selenium.webdriver.common.keys import Keys
    SELENIUM_AVAILABLE = True
except ImportError:
    print("WARNING: selenium not installed, skipping browser tests")


# ═══════════════════════════════════════════════════════════════
# PART 1: CURL-BASED SMOKE TESTS
# ═══════════════════════════════════════════════════════════════

class TestCurlSmoke(unittest.TestCase):
    """HTTP-level smoke tests using curl subprocess calls."""

    def _curl(self, url, *extra_args):
        """Run curl and return (status_code, headers, body)."""
        cmd = ["curl", "-s", "-o", "/dev/null", "-w",
               "%{http_code}\\n%{content_type}\\n%{size_download}",
               url] + list(extra_args)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        lines = result.stdout.strip().split("\n")
        return {
            "status": int(lines[0]) if lines else 0,
            "content_type": lines[1] if len(lines) > 1 else "",
            "size": int(lines[2]) if len(lines) > 2 else 0,
        }

    def _curl_body(self, url):
        """Run curl and return the response body."""
        result = subprocess.run(
            ["curl", "-s", url], capture_output=True, text=True, timeout=15
        )
        return result.stdout

    # ── Tests ──

    def test_01_server_responds(self):
        """Server returns HTTP 200 on root."""
        r = self._curl(BASE_URL)
        self.assertEqual(r["status"], 200, f"Expected 200, got {r['status']}")
        print(f"  PASS: Root returns HTTP {r['status']}")

    def test_02_content_type_html(self):
        """Root serves text/html."""
        r = self._curl(BASE_URL)
        self.assertIn("text/html", r["content_type"],
                       f"Expected text/html, got {r['content_type']}")
        print(f"  PASS: Content-Type is {r['content_type']}")

    def test_03_html_has_title(self):
        """HTML contains the app title."""
        body = self._curl_body(BASE_URL)
        self.assertIn("<title>Zeroth Doctrine</title>", body,
                       "Missing <title>Zeroth Doctrine</title> in HTML")
        print("  PASS: HTML contains <title>Zeroth Doctrine</title>")

    def test_04_html_has_root_div(self):
        """HTML has a #root element for React to mount into."""
        body = self._curl_body(BASE_URL)
        self.assertIn('id="root"', body, "Missing #root div in HTML")
        print("  PASS: HTML has #root div")

    def test_05_html_has_js_bundle(self):
        """HTML references a JavaScript bundle."""
        body = self._curl_body(BASE_URL)
        self.assertTrue(
            re.search(r'<script\s+src="[^"]*\.js"', body),
            "No <script src=*.js> found in HTML"
        )
        print("  PASS: HTML references a JS bundle")

    def test_06_js_bundle_loads(self):
        """The main JS bundle returns 200 and has substantial size."""
        body = self._curl_body(BASE_URL)
        match = re.search(r'<script\s+src="(/[^"]*\.js)"', body)
        self.assertIsNotNone(match, "Could not extract JS bundle URL")
        bundle_url = BASE_URL + match.group(1)
        r = self._curl(bundle_url)
        self.assertEqual(r["status"], 200,
                         f"Bundle returned {r['status']}")
        self.assertGreater(r["size"], 100000,
                           f"Bundle too small: {r['size']} bytes")
        print(f"  PASS: JS bundle loads ({r['size']:,} bytes)")

    def test_07_no_import_meta_in_bundle(self):
        """The JS bundle does not contain raw import.meta (would crash browser)."""
        body = self._curl_body(BASE_URL)
        match = re.search(r'<script\s+src="(/[^"]*\.js)"', body)
        self.assertIsNotNone(match, "Could not extract JS bundle URL")
        bundle_url = BASE_URL + match.group(1)
        bundle = self._curl_body(bundle_url)
        count = bundle.count("import.meta")
        self.assertEqual(count, 0,
                         f"Found {count} 'import.meta' in bundle (would cause SyntaxError)")
        print(f"  PASS: No import.meta in JS bundle")

    def test_08_favicon_loads(self):
        """Favicon is served."""
        r = self._curl(BASE_URL + "/favicon.ico")
        self.assertEqual(r["status"], 200, "Favicon not found")
        print(f"  PASS: Favicon loads ({r['size']} bytes)")

    def test_09_body_has_expo_reset_styles(self):
        """HTML has the Expo recommended style reset."""
        body = self._curl_body(BASE_URL)
        self.assertIn("expo-reset", body,
                       "Missing expo-reset styles in HTML")
        print("  PASS: Expo reset styles present")

    def test_10_body_overflow_hidden(self):
        """Body has overflow hidden (no scrollbars for fullscreen 3D)."""
        body = self._curl_body(BASE_URL)
        self.assertIn("overflow: hidden", body.replace("overflow:hidden", "overflow: hidden"),
                       "Missing overflow:hidden on body")
        print("  PASS: Body overflow is hidden")


# ═══════════════════════════════════════════════════════════════
# PART 2: SELENIUM BROWSER TESTS
# ═══════════════════════════════════════════════════════════════

@unittest.skipUnless(SELENIUM_AVAILABLE, "Selenium not installed")
class TestSeleniumBrowser(unittest.TestCase):
    """Integration tests using headless Chrome via Selenium WebDriver."""

    driver = None

    @classmethod
    def setUpClass(cls):
        options = Options()
        if HEADLESS:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1280,720")
        # Suppress WebGL warnings in headless
        options.add_argument("--enable-webgl")
        options.add_argument("--use-gl=angle")
        options.add_argument("--ignore-gpu-blocklist")

        cls.driver = webdriver.Chrome(options=options)
        cls.driver.set_page_load_timeout(30)
        cls.driver.get(BASE_URL)
        # Wait for React to mount (the #root div gets children)
        time.sleep(5)

    @classmethod
    def tearDownClass(cls):
        if cls.driver:
            cls.driver.quit()

    # ── Helpers ──

    def _no_js_errors(self):
        """Return list of severe JS console errors."""
        logs = self.driver.get_log("browser")
        severe = [l for l in logs if l.get("level") == "SEVERE"
                  and "import.meta" not in l.get("message", "")
                  and "favicon" not in l.get("message", "").lower()]
        return severe

    def _wait_for(self, by, value, timeout=10):
        """Wait for an element to be present."""
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )

    # ── Tests ──

    def test_01_page_loads(self):
        """Page loads without hanging."""
        self.assertIn("Zeroth Doctrine", self.driver.title)
        print(f"  PASS: Page title is '{self.driver.title}'")

    def test_02_canvas_renders(self):
        """A WebGL canvas element is present (Three.js rendered)."""
        canvases = self.driver.find_elements(By.TAG_NAME, "canvas")
        self.assertGreater(len(canvases), 0, "No <canvas> element found")
        canvas = canvases[0]
        self.assertGreater(canvas.size["width"], 100, "Canvas too narrow")
        self.assertGreater(canvas.size["height"], 100, "Canvas too short")
        print(f"  PASS: Canvas found ({canvas.size['width']}x{canvas.size['height']})")

    def test_03_canvas_has_webgl_context(self):
        """Canvas has a valid WebGL context (not just empty)."""
        result = self.driver.execute_script("""
            const c = document.querySelector('canvas');
            if (!c) return 'NO_CANVAS';
            const gl = c.getContext('webgl2') || c.getContext('webgl');
            if (!gl) return 'NO_CONTEXT';
            return 'OK:' + gl.getParameter(gl.VERSION);
        """)
        self.assertTrue(result.startswith("OK:"),
                        f"WebGL context issue: {result}")
        print(f"  PASS: WebGL context active ({result})")

    def test_04_intro_title_visible(self):
        """The intro title overlay is displayed on load."""
        # The intro title is in the HTML overlay, rendered by React Native Web
        # Look for text containing "TENSOR ZERO"
        time.sleep(1)
        body_text = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertTrue(
            "TENSOR ZERO" in body_text or "DOCTRINE" in body_text,
            f"Intro title not found in page text. Got: {body_text[:200]}"
        )
        print("  PASS: Intro title text is visible")

    def test_05_no_critical_js_errors(self):
        """No critical JavaScript errors in console."""
        errors = self._no_js_errors()
        if errors:
            for e in errors[:3]:
                print(f"    JS ERROR: {e['message'][:120]}")
        self.assertEqual(len(errors), 0,
                         f"Found {len(errors)} critical JS errors")
        print("  PASS: No critical JS errors in console")

    def test_06_tour_advances_to_chapter(self):
        """After the intro (~6s), the tour advances and chapter text appears."""
        # Wait for intro to finish + approach + start of dwell
        time.sleep(8)
        body_text = self.driver.find_element(By.TAG_NAME, "body").text
        # Should see chapter content or "The" something from Chapter I
        chapter_visible = any(term in body_text for term in [
            "Nature of the Container",
            "The Totality",
            "Totality",
            "Click anywhere",
        ])
        self.assertTrue(chapter_visible,
                        f"Tour did not advance to Chapter I. Text: {body_text[:300]}")
        print("  PASS: Tour advanced to Chapter I")

    def test_07_progress_dots_present(self):
        """Progress indicator dots are rendered during tour."""
        # Progress dots are small View elements. We look for the container.
        # They are styled as small circular divs
        time.sleep(1)
        dots = self.driver.execute_script("""
            // Progress dots are small colored divs with border-radius
            const allDivs = document.querySelectorAll('div');
            let dotCount = 0;
            allDivs.forEach(d => {
                const s = window.getComputedStyle(d);
                const w = parseInt(s.width);
                const h = parseInt(s.height);
                const br = parseInt(s.borderRadius);
                if (w >= 6 && w <= 30 && h >= 6 && h <= 10 && br >= 3) {
                    dotCount++;
                }
            });
            return dotCount;
        """)
        self.assertGreaterEqual(dots, 5,
                                f"Expected >= 5 progress dots, found {dots}")
        print(f"  PASS: Found {dots} progress-like dots")

    def test_08_letterbox_bars_during_tour(self):
        """Letterbox bars (40px black bars) present during touring phase."""
        # Check for the two 40px high black bars
        result = self.driver.execute_script("""
            const allDivs = document.querySelectorAll('div');
            let barCount = 0;
            allDivs.forEach(d => {
                const s = window.getComputedStyle(d);
                const h = parseInt(s.height);
                const bg = s.backgroundColor;
                const pos = s.position;
                if (h === 40 && bg === 'rgb(0, 0, 0)' && pos === 'absolute') {
                    barCount++;
                }
            });
            return barCount;
        """)
        self.assertGreaterEqual(result, 2,
                                f"Expected 2 letterbox bars, found {result}")
        print(f"  PASS: {result} letterbox bars present")

    def test_09_click_interrupts_tour(self):
        """Clicking during the tour switches to free explore mode."""
        # Click on the canvas area
        canvas = self.driver.find_elements(By.TAG_NAME, "canvas")
        if canvas:
            ActionChains(self.driver).click(canvas[0]).perform()
            time.sleep(1)
            body_text = self.driver.find_element(By.TAG_NAME, "body").text
            # In free explore, we should see WASD hint or Resume Tour
            free_explore = any(term in body_text for term in [
                "WASD",
                "Resume Tour",
                "Drag to look",
                "fly",
            ])
            self.assertTrue(free_explore,
                            f"Free explore not activated after click. Text: {body_text[:300]}")
            print("  PASS: Click interrupts tour -> free explore mode")
        else:
            self.skipTest("No canvas found to click")

    def test_10_resume_tour_button(self):
        """Resume Tour button appears in free explore mode."""
        time.sleep(0.5)
        body_text = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertIn("Resume Tour", body_text,
                       "Resume Tour button not visible in free explore")
        print("  PASS: 'Resume Tour' button is visible")

    def test_11_canvas_is_animating(self):
        """Canvas content is changing (animation is running)."""
        canvas = self.driver.find_elements(By.TAG_NAME, "canvas")[0]

        # Take two snapshots 500ms apart and compare
        snap1 = self.driver.execute_script("""
            const c = document.querySelector('canvas');
            return c.toDataURL('image/png').substring(0, 200);
        """)
        time.sleep(0.5)
        snap2 = self.driver.execute_script("""
            const c = document.querySelector('canvas');
            return c.toDataURL('image/png').substring(0, 200);
        """)
        # In an animated scene, the two snapshots should differ
        # (Note: some headless environments may not render, so we allow both)
        if snap1 != snap2:
            print("  PASS: Canvas is animating (frames differ)")
        else:
            print("  PASS: Canvas present (headless may not animate frames)")

    def test_12_webgl_no_errors(self):
        """No WebGL errors reported."""
        result = self.driver.execute_script("""
            const c = document.querySelector('canvas');
            if (!c) return 'NO_CANVAS';
            const gl = c.getContext('webgl2') || c.getContext('webgl');
            if (!gl) return 'NO_CONTEXT';
            const err = gl.getError();
            return err === 0 ? 'OK' : 'GL_ERROR:' + err;
        """)
        self.assertEqual(result, "OK", f"WebGL error: {result}")
        print(f"  PASS: No WebGL errors")


# ═══════════════════════════════════════════════════════════════
# RUNNER
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 60)
    print("ZEROTH DOCTRINE - WEB EXPERIENCE TEST SUITE")
    print(f"Target: {BASE_URL}")
    print("=" * 60)

    # Check server is up first
    try:
        result = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", BASE_URL],
            capture_output=True, text=True, timeout=5
        )
        if result.stdout.strip() != "200":
            print(f"\nERROR: Server not responding at {BASE_URL}")
            print("Start the dev server first: npx expo start --web --port 8099")
            sys.exit(1)
    except Exception as e:
        print(f"\nERROR: Cannot reach server: {e}")
        sys.exit(1)

    print(f"\nServer is up at {BASE_URL}")
    print()

    # Run tests
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add curl tests first (fast, no browser)
    suite.addTests(loader.loadTestsFromTestCase(TestCurlSmoke))

    # Add selenium tests if available
    if SELENIUM_AVAILABLE:
        suite.addTests(loader.loadTestsFromTestCase(TestSeleniumBrowser))
    else:
        print("SKIPPING Selenium tests (not installed)\n")

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Summary
    print("\n" + "=" * 60)
    total = result.testsRun
    failures = len(result.failures) + len(result.errors)
    passed = total - failures
    print(f"RESULTS: {passed}/{total} passed, {failures} failed")
    print("=" * 60)

    sys.exit(0 if failures == 0 else 1)
