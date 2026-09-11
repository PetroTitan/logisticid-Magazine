import Link from "next/link";

import { PolicyPage } from "@/components/policy-page";
import { staticAlternates, staticPath } from "@/lib/localized-routes";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  path: "/image-policy",
  title: "Image and AI policy",
  description:
    "How LogisticID Magazine sources images, what provenance it records, and how AI is and is not used in producing articles.",
  languages: staticAlternates("image-policy"),
});

export default function ImagePolicyPage() {
  return (
    <PolicyPage
      route="image-policy"
      standfirst="What appears alongside an article is a claim too. This page sets out where images come from and how AI is used."
      title="Image and AI policy"
    >
      <h2 id="provenance">Image provenance</h2>
      <p>
        An image is published only when its rights can be stated. For every image the Magazine
        records the source, the creator, the licence, a link to the original where one exists, the
        credit line, descriptive alternative text and the intrinsic dimensions. These are required
        fields: an article whose image is missing any of them does not build.
      </p>
      <p>
        Dimensions are required for a second reason. Without them the browser cannot reserve space
        before the image loads, and the text a reader is part-way through moves under them.
      </p>

      <h2 id="not-used">What is not used</h2>
      <p>
        No images are taken from Pinterest, image aggregators, search results or any source whose
        rights cannot be established. &ldquo;Widely reproduced&rdquo; is not a licence.
      </p>

      <h2 id="illustration">Illustration versus evidence</h2>
      <p>
        Diagrams and illustrations are labelled as illustrations wherever they appear. A generated
        or drawn image is never presented as a photograph of the thing being described, and an
        image is never used as evidence for a claim the text does not support with a source.
      </p>
      <p>
        The Magazine is designed to look finished without photography. Where there is no image with
        clean provenance, an article runs without one rather than with a stock photograph of a lorry
        that shows the reader nothing.
      </p>

      <h2 id="ai">How AI is used</h2>
      <p>
        AI tools may be used for drafting assistance, structuring and editing. They are not used to
        generate facts, sources, citations, quotations, statistics or regulatory positions, and
        nothing reaches publication without a person checking each material claim against the source
        cited for it.
      </p>
      <p>
        This matters specifically here. A language model asked about customs procedure or a
        transport regulation will produce a fluent, plausible, correctly formatted answer whether or
        not it is right, and will invent a regulation number as readily as it will recall one. In
        freight, acting on such an answer has customs, contractual and safety consequences, so the
        sourcing requirements in the{" "}
        <Link href={staticPath("sourcing-policy", "en")}>sourcing policy</Link> apply to every
        factual claim regardless of
        how a draft was produced.
      </p>
    </PolicyPage>
  );
}
