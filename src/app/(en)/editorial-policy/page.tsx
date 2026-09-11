import Link from "next/link";

import { PolicyPage } from "@/components/policy-page";
import { publisher } from "@/config/publisher";
import { staticAlternates } from "@/lib/localized-routes";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  path: "/editorial-policy",
  title: "Editorial policy",
  description:
    "What LogisticID Magazine publishes, what it refuses to publish, and where its guidance stops and professional advice begins.",
  languages: staticAlternates("editorial-policy"),
});

export default function EditorialPolicyPage() {
  return (
    <PolicyPage
      route="editorial-policy"
      standfirst="LogisticID Magazine explains how European road freight works. It is published by LogisticID, a freight forwarder, and this page sets out what that means for what you read here."
      title="Editorial policy"
    >
      <h2 id="what-this-is">What this publication is</h2>
      <p>
        LogisticID Magazine is educational and informational. It explains load types, equipment,
        planning, documentation and the regulatory landscape of European road freight so that
        someone arranging a shipment understands the decisions in front of them.
      </p>
      <p>
        It is general information about how freight works. It is not an assessment of your
        shipment.
      </p>

      <h2 id="boundary">Where this stops</h2>
      <p>Nothing published here replaces:</p>
      <ul>
        <li>a freight forwarder&rsquo;s assessment of a specific shipment;</li>
        <li>a carrier&rsquo;s decision to accept or refuse a load;</li>
        <li>a customs broker, or the customs authority with jurisdiction;</li>
        <li>legal, tax, sanctions or insurance advice;</li>
        <li>a dangerous-goods safety adviser;</li>
        <li>the authority responsible for a licence, permit or enforcement decision;</li>
        <li>review of the contract you are actually signing.</li>
      </ul>
      <p>
        Where an outcome depends on route, cargo, equipment, contract, jurisdiction, date or a
        carrier&rsquo;s acceptance, articles say so rather than stating a result. That is why the
        language in regulatory and operational articles is careful: the honest answer to many
        freight questions is that it depends, and saying otherwise would be more useful only if it
        were true.
      </p>

      <h2 id="ownership">Who publishes this, and the interest they have</h2>
      <p>
        LogisticID arranges European road freight through third-party transport providers. It has a
        commercial interest in readers understanding freight well enough to work with a forwarder,
        and it is not a neutral party.
      </p>
      <p>
        That interest is handled by disclosing it rather than by pretending it away. Articles do not
        rank carriers, do not compare LogisticID favourably against named competitors, and carry no
        advertising, affiliate links or paid placement. Links to LogisticID service pages are
        labelled as such and appear after the article, not inside its argument.
      </p>

      <h2 id="imprint">The company behind the Magazine</h2>
      <p>
        LogisticID Magazine is published by {publisher.legalName}, company identification number
        (IČO) {publisher.registrationNumber}, entered in the {publisher.registry} under file{" "}
        {publisher.registryFileNumber}, with its registered office at {publisher.registeredOffice}.
        Correspondence about the Magazine reaches the company at{" "}
        <a href={`mailto:${publisher.contactEmail}`}>{publisher.contactEmail}</a>.
      </p>
      <p>
        That address is the company&rsquo;s registered office: the address at which documents can be
        served on it. It is not an editorial office, a warehouse, a terminal or a depot, and there
        is nothing at it for a reader or a customer to visit. LogisticID arranges transport that
        independent carriers perform and operates no facility.
      </p>

      <h2 id="never">What is never published</h2>
      <p>
        The Magazine does not invent facts to fill a page. It will not publish a freight rate, fuel
        surcharge, transit time, availability, customs or regulatory requirement, sanctions
        conclusion, carrier eligibility decision, cargo acceptance decision, quotation, report,
        dataset, standard, citation, incident statistic, emissions figure or savings claim that has
        not been verified against a real source.
      </p>
      <p>
        It also publishes no &ldquo;most popular&rdquo;, &ldquo;trending&rdquo;,
        &ldquo;best&rdquo;, &ldquo;cheapest&rdquo; or &ldquo;fastest&rdquo; rankings. Those require
        first-party data and a stated methodology; without both, they are decoration that reads as
        evidence.
      </p>
      <p>
        Where a fact has not been supplied and verified, the page says nothing rather than
        estimating. An empty section is more honest than a filled one that is wrong.
      </p>

      <h2 id="dates">Dates and currency</h2>
      <p>
        Every article carries a publication date, and a modification date once it has changed.
        Articles that describe a regulatory or market position also carry the date that position was
        checked and the jurisdiction it applies to, because a rule without a date and a place is not
        a rule a reader can rely on.
      </p>

      <h2 id="related">Related pages</h2>
      <ul>
        <li>
          <Link href="/sourcing-policy">How articles are sourced</Link>
        </li>
        <li>
          <Link href="/image-policy">Images and AI</Link>
        </li>
        <li>
          <Link href="/corrections">Corrections</Link>
        </li>
      </ul>
    </PolicyPage>
  );
}
