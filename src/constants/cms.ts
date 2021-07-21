const CMS = {
  SHORTCODE_REGEX: /\{\{.*\}\}/,
  SHORTCODES: {
    MENU_LINK: /\{\{[\s]*MENU_LINK[\s]*text="[\w\s.\,'-_]{1,333}"[\s]*\}\}/, // {{ MENU_LINK text="menu link"}}
    AUX_LINK: /\{\{[\s]*AUX_LINK[\s]*text="[\w\s.\,'-_]{1,333}"[\s]*\}\}/, // {{ AUX_LINK text="aux link"}}
    MENU_BUTTON: /\{\{[\s]*MENU_BUTTON[\s]*text="[\w\s.\,'-_]{1,333}"[\s]*\}\}/, // {{ MENU_BUTTON text="menu button"}}
    AUX_BUTTON: /\{\{[\s]*AUX_BUTTON[\s]*text="[\w\s.\,'-_]{1,333}"[\s]*\}\}/, // {{ AUX_BUTTON text="aux button"}}
    COLOR: /\{\{[\s]*COLOR[\s]*color="[\#]?[\w0-9\-]{3,333}"[\s]*text="[\w\s.\,'-_]{1,333}"[\s]*\}\}/, // {{ COLOR color="#FF0083 text="Green!" }}
  },
  BLOG_RESULTS_PER_PAGE: 20,
  NUM_RECOMMENDED_POSTS: 8,
};

export default CMS;
