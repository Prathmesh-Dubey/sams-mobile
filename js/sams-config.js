/* Google tracking IDs for sams-mobile.com. Leave a value empty to switch that tag off.
   ga4:        Google Analytics 4 measurement ID, e.g. "G-XXXXXXXXXX"
   ads:        Google Ads tag ID, e.g. "AW-123456789"
   adsLabels:  conversion labels from Google Ads (Goals > Conversions > tag setup), the part after the "/"
   gtm:        optional Google Tag Manager container, e.g. "GTM-XXXXXXX" (only if tags are managed in GTM)
   visitLog:   our own visit log (SAMS Desk > SAMS Visitors); sent only with Analytics consent */
window.SAMS_TRACKING = {
  ga4: "G-97PQ7W76PC",
  ads: "",
  adsLabels: { form: "", phone: "", whatsapp: "" },
  adsValues: { form: 50, phone: 25, whatsapp: 25, currency: "USD" },
  gtm: "",
  visitLog: "https://desk.sams-mobile.com/modules/sams_visitors/beacon_api.php"
};
