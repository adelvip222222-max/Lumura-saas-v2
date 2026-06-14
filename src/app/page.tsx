import { getPublicPlansAction } from "@/actions/plans";
import { HomeLanding } from "@/components/marketing/home-landing";
import Script from "next/script";

export default async function HomePage() {
  const result = await getPublicPlansAction();
  const plans = result.success && result.data ? result.data : [];

  return (
    <>
      <Script id="chatwoot-settings" strategy="afterInteractive">
        {`
          window.chatwootSettings = {"position":"right","type":"standard","launcherTitle":""};
        `}
      </Script>
      <Script id="chatwoot-sdk" strategy="afterInteractive">
        {`
          (function(d,t) {
            var BASE_URL="https://chatzi.io";
            var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
            g.src=BASE_URL+"/packs/js/sdk.js";
            g.async = true;
            s.parentNode.insertBefore(g,s);
            g.onload=function(){
              window.chatwootSDK.run({
                websiteToken: 'idAHwLth9S2vXEpvxn3zJ3Dk',
                baseUrl: BASE_URL
              })
            }
          })(document,"script");
        `}
      </Script>
      <HomeLanding plans={plans} />
    </>
  );
}
