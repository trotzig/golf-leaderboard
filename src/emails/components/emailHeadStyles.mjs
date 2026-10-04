// Styles that can't be inlined: the mobile layout and dark mode. The dark
// colors mirror the `prefers-color-scheme: dark` tokens in `styles.css`.
export const emailHeadStyles = `
  :root {
    color-scheme: light dark;
    supported-color-schemes: light dark;
  }

  .body {
    background-color: #eff6f2 !important;
    padding-left: 12px;
    padding-right: 12px;
  }

  @media (max-width: 600px) {
    .body {
      padding-left: 0 !important;
      padding-right: 0 !important;
    }

    .container > tbody > tr > td {
      padding-left: 20px !important;
      padding-right: 20px !important;
    }

    .main-container {
      border-radius: 0 !important;
      margin-top: 0 !important;
    }

    .main-container > tbody > tr > td {
      padding-top: 28px !important;
      padding-bottom: 32px !important;
    }
  }

  @media (prefers-color-scheme: dark) {
    .body,
    .footer-container {
      background-color: #1b201e !important;
    }

    .main-container {
      background-color: #242b28 !important;
    }

    .main-container,
    .main-container p,
    .main-container td,
    .main-container h1,
    .main-container a.wordmark-text {
      color: #f0f0f0 !important;
      -webkit-text-fill-color: #f0f0f0 !important;
    }

    .main-container a,
    .footer-container a {
      color: #6fc39e !important;
      -webkit-text-fill-color: #6fc39e !important;
    }

    .main-container a.cta-button {
      background-color: #6fc39e !important;
      color: #10231b !important;
      -webkit-text-fill-color: #10231b !important;
    }

    .main-container .callout,
    .main-container .sponsor-box {
      background-color: #1b201e !important;
    }

    .main-container p.under-par {
      color: #ee6d5a !important;
      -webkit-text-fill-color: #ee6d5a !important;
    }

    .main-container p.muted-text,
    .muted-text {
      color: #a3aaa6 !important;
      -webkit-text-fill-color: #a3aaa6 !important;
    }
  }
`;
