/* @flow strict-local */
import { Platform } from 'react-native';
import type { WebViewNavigation } from 'react-native-webview';
import * as logging from '../utils/logging';

/**
 * Returns the `onShouldStartLoadWithRequest` function for webviews for a
 * given base URL.
 *
 * Paranoia^WSecurity: only load `baseUrl`, and only load it once. Any other
 * requests should be handed off to the OS, not loaded inside the WebView.
 */
export default (baseUrl: string) => {
  const onShouldStartLoadWithRequest: (event: WebViewNavigation) => boolean = (() => {
    // Inner closure to actually test the URL.
    const urlTester: (url: string) => boolean = (() => {
      // On Android this function is documented to be skipped on first load:
      // therefore, simply never return true.
      if (Platform.OS === 'android') {
        return (url: string) => false;
      }

      // Otherwise (for iOS), return a closure that evaluates to `true` _exactly
      // once_, and even then only if the URL looks like what we're expecting.
      let loaded_once = false;
      // The baseUrl, with its relative portion (if any) stripped.
      const baseUrlTail = baseUrl.replace(/^\.\//, '');
      // Disallow such monstrosities as `evilsite.com/?./webview/index.html`.
      const unsafeUrlRegex = /[&?]/;
      return (url: string) => {
        if (!loaded_once) {
          // The exact URL that will be loaded could be determined statically on
          // Android. On iOS, though, it involves some unpredictable UUIDs which
          // RN provides no good interface to. (`react-native-fs` is awful.)
          if (url.startsWith('file://') && url.endsWith(baseUrlTail) && !unsafeUrlRegex.test(url)) {
            loaded_once = true;
            return true;
          }
        }
        return false;
      };
    })();

    // Outer closure to perform logging.
    return (event: WebViewNavigation) => {
      const ok = urlTester(event.url);
      if (!ok) {
        logging.warn('webview: rejected navigation event', {
          navigation_event: { ...event },
          expected_url: baseUrl,
        });
      }
      return ok;
    };
  })();

  return onShouldStartLoadWithRequest;
};

/**
 * A URL-like magic string denoting the webview-assets folder.
 *
 * Not suitable for reuse or export.
 */
export const assetsPath = Platform.OS === 'ios' ? './webview' : 'file:///android_asset/webview';
// What the value above probably _should_ be, semantically, is an absolute
// `file:`-scheme URL pointing to the webview-assets folder. [1]
//
// * On Android, that's exactly what it is. Different apps' WebViews see
//   different (virtual) root directories as `file:///`, and in particular
//   the WebView provides the APK's `assets/` directory as
//   `file:///android_asset/`. [2]  We can easily hardcode that, so we do.
//
// * On iOS, it's not: it's a relative path. (Or relative URL, if you prefer.)
//   We can't make it absolute here, because neither React Native itself nor any
//   of our current dependencies directly expose the Foundation API that would
//   tell us the absolute path that our bundle is located at [3].
//
//   Instead, for now, we exploit the fact that (the iOS version of)
//   react-native-webview will have React Native resolve it with respect to
//   the bundle's absolute path. [4]  This fact is not known to be
//   documented, however, and should not be taken for granted indefinitely.
//
// [1] See `tools/build-webview` for more information on what folder that is.
//
// [2] Oddly, this essential feature doesn't seem to be documented!  It's
//     widely described in how-tos across the web and StackOverflow answers.
//     It's assumed in some related docs which mention it in passing, and
//     treated matter-of-factly in some Chromium bug threads.  Details at:
//     https://chat.zulip.org/#narrow/stream/243-mobile-team/topic/android.20filesystem/near/796440
//
// [3] Specifically, `Bundle.main.bundleURL` (aka `[[NSBundle mainbundle]
//     bundleURL]`).  Alternatively, `resourceURL` has a meaning similar to
//     the `assets/` directory in an Android app; for iOS app bundles, it
//     has the same value as `bundleURL`.
//     https://github.com/zulip/zulip-mobile/pull/3677#discussion_r344423032
//
// [4] https://github.com/react-native-community/react-native-webview/blob/v5.12.1/ios/RNCWKWebView.m#L376
//     https://github.com/facebook/react-native/blob/v0.59.10/React/Base/RCTConvert.m#L85
