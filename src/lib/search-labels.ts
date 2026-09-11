import type { Locale } from "@/config/locales";
import { strings } from "@/config/ui-strings";
import type { SearchLabels } from "@/components/search-client";

/**
 * The search control's strings for one language.
 *
 * Built on the server and handed to the client component as data. The
 * dictionary itself never crosses into the bundle, so a second language costs
 * nothing in shipped JavaScript.
 */
export function searchLabels(locale: Locale): SearchLabels {
  const ui = strings(locale);
  return {
    fieldLabel: ui.searchFieldLabel,
    placeholder: ui.searchPlaceholder,
    submit: ui.searchSubmit,
    indexFailed: ui.searchIndexFailed,
    indexFailedLinkText: ui.searchIndexFailedLinkText,
    indexFailedTail: ui.searchIndexFailedTail,
    prompt: ui.searchPrompt,
    loading: ui.searchLoading,
    noResults: ui.searchNoResults,
    resultsOne: ui.searchResultsOne,
    resultsMany: ui.searchResultsMany,
  };
}
