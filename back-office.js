// Wenzel "Back Office" — authentic Shopify Polaris admin, self-mounted as a web component.
// Loads Polaris React from CDN and runs its own React root so it never collides with the deck runtime's React.
(function () {
  const POLARIS = 'https://esm.sh/@shopify/polaris@12';
  const REACT = 'https://esm.sh/react@18.3.1';
  const REACTDOM = 'https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1';
  const POLARIS_MOD = POLARIS + '?deps=react@18.3.1,react-dom@18.3.1';
  const CSS = POLARIS + '/build/esm/styles.css';

  // inject Polaris stylesheet once
  if (!document.querySelector('link[data-polaris]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = CSS; l.setAttribute('data-polaris', '1');
    document.head.appendChild(l);
  }
  // scoped overrides: re-anchor Frame's fixed TopBar/Navigation to the embedded box,
  // and make the main panel scroll internally instead of the page.
  if (!document.querySelector('style[data-polaris-embed]')) {
    const s = document.createElement('style');
    s.setAttribute('data-polaris-embed', '1');
    s.textContent = [
      'wenzel-back-office{contain:layout paint;}',
      'wenzel-back-office .Polaris-Frame{position:relative;height:100%;min-height:0;background:var(--p-color-bg-surface-secondary,#f1f1f1);}',
      'wenzel-back-office .Polaris-Frame__TopBar{position:absolute;top:0;left:0;right:0;width:100%;}',
      'wenzel-back-office .Polaris-Frame__Navigation{position:absolute;top:56px;bottom:0;left:0;height:auto;max-height:none;transform:none;}',
      'wenzel-back-office .Polaris-Frame__Main{padding-top:56px;height:100%;}',
      'wenzel-back-office .Polaris-Frame__Content{height:calc(100% - 56px);overflow:auto;}',
      'wenzel-back-office .Polaris-Frame__ContextualSaveBar,wenzel-back-office .Polaris-Frame__Skip{display:none;}',
    ].join('');
    document.head.appendChild(s);
  }

  // ---------- demo data (illustrative, matches the deck) ----------
  const D = {
    metrics: [
      { label: 'GMV tonight', value: '$4,820', tone: undefined },
      { label: 'Bids placed', value: '1,140', tone: undefined },
      { label: 'Lots sold', value: '38', tone: undefined },
      { label: 'Sell-through', value: '92%', tone: 'success' },
    ],
    topLots: [
      ['Blastoise · Base Set (error)', '$340'],
      ['Espeon V · factory error', '$245'],
      ['Charizard VMAX · Brilliant Stars', '$190'],
    ],
    shows: [
      { name: 'Ascended Heroes Rip N Ship', when: 'Fri · 7:00 PM ET', status: 'Scheduled', tone: 'info' },
      { name: 'Showdown Saturday', when: 'Sat · 7:00 PM ET', status: 'Scheduled', tone: 'info' },
      { name: 'Wenz Vault', when: 'Sun · 6:00 PM ET', status: 'Draft', tone: undefined },
    ],
    lots: [
      ['Ascended Heroes ETB', '$40', 'Auction'],
      ['151 Booster Bundle', '$55', 'Auction'],
      ['Crown Zenith Booster', '$8', 'Buy It Now'],
    ],
    bidders: [
      { handle: '@slabhunter_mike', name: 'Mike R.', card: 'On file', cardTone: 'success', spend: '$2,140', status: 'Active', statusTone: 'success' },
      { handle: '@PSA10orBust', name: 'Dana L.', card: 'On file', cardTone: 'success', spend: '$980', status: 'Active', statusTone: 'success' },
      { handle: '@ripcity_cole', name: 'Cole T.', card: 'Declined', cardTone: 'warning', spend: '$310', status: 'Card declined', statusTone: 'warning' },
      { handle: '@vault_vince', name: 'Vince P.', card: 'On file', cardTone: 'success', spend: '$1,520', status: 'Active', statusTone: 'success' },
      { handle: '@errorhunter88', name: '—', card: 'None', cardTone: undefined, spend: '$0', status: 'Banned', statusTone: 'critical' },
    ],
    orders: [
      { id: '#WZ-2041', winner: '@slabhunter_mike', lots: '4 lots', total: '$612', status: 'Finalized', tone: 'success' },
      { id: '#WZ-2042', winner: '@PSA10orBust', lots: '2 lots', total: '$245', status: 'Draft · live', tone: 'attention' },
      { id: '#WZ-2043', winner: '@vault_vince', lots: '3 lots', total: '$430', status: 'Draft · live', tone: 'attention' },
      { id: '#WZ-2040', winner: '@binderqueen', lots: '1 lot', total: '$95', status: 'Fulfilled', tone: 'success' },
    ],
  };

  async function boot(el) {
    let React, createRoot, P, i18n = {};
    try {
      [React, { createRoot }, P] = await Promise.all([
        import(REACT),
        import(REACTDOM),
        import(POLARIS_MOD),
      ]);
      React = React.default || React;
    } catch (e) {
      el.innerHTML = '<div style="padding:24px;font-family:sans-serif;color:#6D7175;background:#fff;height:100%;">Polaris admin unavailable offline.</div>';
      return;
    }
    try { const r = await fetch(POLARIS + '/locales/en.json'); i18n = await r.json(); } catch (e) {}

    const h = React.createElement;
    const { useState } = React;
    const {
      AppProvider, Frame, Navigation, TopBar, Page, Tabs, Card, Badge, Button, Text,
      BlockStack, InlineStack, InlineGrid, Box, Divider, DataTable, RangeSlider, Checkbox, Banner,
    } = P;

    const badge = (label, tone) => h(Badge, tone ? { tone } : {}, label);

    function MetricCard(m) {
      return h(Card, { key: m.label }, h(BlockStack, { gap: '100' }, [
        h(Text, { key: 't', as: 'span', variant: 'bodySm', tone: 'subdued' }, m.label),
        h(Text, { key: 'v', as: 'p', variant: 'headingLg', tone: m.tone }, m.value),
      ]));
    }

    function Overview() {
      return h(BlockStack, { gap: '400' }, [
        h(Banner, { key: 'b', tone: 'info', title: "Tonight's show — Ascended Heroes Rip N Ship" },
          h(Text, { as: 'span' }, 'Live now · auctions are open.')),
        h(InlineGrid, { key: 'm', columns: { xs: 2, sm: 4 }, gap: '300' }, D.metrics.map(MetricCard)),
        h(Card, { key: 'top' }, h(BlockStack, { gap: '300' }, [
          h(Text, { key: 'h', as: 'h3', variant: 'headingSm' }, 'Top lots'),
          h(DataTable, {
            key: 'dt',
            columnContentTypes: ['text', 'numeric'],
            headings: ['Lot', 'Hammer price'],
            rows: D.topLots,
          }),
        ])),
        h(Text, { key: 'note', as: 'span', variant: 'bodySm', tone: 'subdued' }, 'Figures shown are example data for this preview.'),
      ]);
    }

    function Auctions() {
      return h(BlockStack, { gap: '400' }, [
        h(Card, { key: 'shows' }, h(BlockStack, { gap: '300' }, [
          h(InlineStack, { key: 'hd', align: 'space-between', blockAlign: 'center' }, [
            h(Text, { key: 't', as: 'h3', variant: 'headingSm' }, 'Upcoming shows'),
            h(Button, { key: 'b', variant: 'primary' }, 'Schedule show'),
          ]),
          h(BlockStack, { key: 'list', gap: '0' }, D.shows.map((s, i) =>
            h(Box, { key: s.name, paddingBlock: '300', borderBlockStartWidth: i ? '025' : '0', borderColor: 'border' },
              h(InlineStack, { align: 'space-between', blockAlign: 'center' }, [
                h(BlockStack, { key: 'l', gap: '0' }, [
                  h(Text, { key: 'n', as: 'span', fontWeight: 'medium' }, s.name),
                  h(Text, { key: 'w', as: 'span', variant: 'bodySm', tone: 'subdued' }, s.when),
                ]),
                badge(s.status, s.tone),
              ])))),
        ])),
        h(Card, { key: 'lots', padding: '0' }, h(BlockStack, { gap: '0' }, [
          h(Box, { key: 'h', padding: '300' }, h(Text, { as: 'h3', variant: 'headingSm' }, 'Lots — Friday show')),
          h(DataTable, {
            key: 'dt',
            columnContentTypes: ['text', 'numeric', 'text'],
            headings: ['Product', 'Start price', 'Format'],
            rows: D.lots,
          }),
        ])),
      ]);
    }

    function Bidders() {
      const rows = D.bidders.map((b) => [
        h(Text, { as: 'span', fontWeight: 'medium' }, b.handle),
        b.name,
        badge(b.card, b.cardTone),
        b.spend,
        h(InlineStack, { gap: '200', blockAlign: 'center' }, [
          badge(b.status, b.statusTone),
          h(Button, { key: 'ban', size: 'micro', tone: 'critical', variant: 'tertiary', disabled: b.status === 'Banned' }, b.status === 'Banned' ? 'Banned' : 'Ban'),
        ]),
      ]);
      return h(Card, { padding: '0' }, h(DataTable, {
        columnContentTypes: ['text', 'text', 'text', 'numeric', 'text'],
        headings: ['Handle', 'Name', 'Card on file', 'Lifetime spend', 'Status'],
        rows,
      }));
    }

    function Orders() {
      const rows = D.orders.map((o) => [
        h(Text, { as: 'span', tone: 'magic', fontWeight: 'medium' }, o.id),
        o.winner, o.lots, o.total, badge(o.status, o.tone),
      ]);
      return h(BlockStack, { gap: '300' }, [
        h(Banner, { key: 'b', tone: 'info' }, 'One consolidated order per winner per show — a draft during the show, finalized at the end.'),
        h(Card, { key: 'c', padding: '0' }, h(DataTable, {
          columnContentTypes: ['text', 'text', 'text', 'numeric', 'text'],
          headings: ['Order', 'Winner', 'Lots', 'Total', 'Status'],
          rows,
        })),
      ]);
    }

    function Settings() {
      const [timer, setTimer] = useState(20);
      const [requireCard, setRequireCard] = useState(true);
      return h(BlockStack, { gap: '400' }, [
        h(Card, { key: 'timer' }, h(BlockStack, { gap: '200' }, [
          h(RangeSlider, {
            label: 'Default lot timer', min: 10, max: 30, step: 1, value: timer,
            onChange: setTimer, suffix: h(Text, { as: 'span', tone: 'subdued' }, timer + 's'),
            output: true,
          }),
          h(Text, { key: 'help', as: 'span', variant: 'bodySm', tone: 'subdued' }, 'Range 10–30s. Popcorn adds +5s on a late bid.'),
        ])),
        h(Card, { key: 'card' }, h(Checkbox, {
          label: 'Require card on file to bid',
          helpText: 'Bidders authorize a card once before joining the floor.',
          checked: requireCard, onChange: setRequireCard,
        })),
        h(Card, { key: 'pay' }, h(InlineStack, { align: 'space-between', blockAlign: 'center' }, [
          h(Text, { key: 'l', as: 'span', fontWeight: 'medium' }, 'Payments'),
          badge('Shopify Payments · connected', 'success'),
        ])),
      ]);
    }

    const TABS = [
      { id: 'overview', content: 'Overview', render: Overview },
      { id: 'auctions', content: 'Auctions', render: Auctions },
      { id: 'bidders', content: 'Bidders', render: Bidders },
      { id: 'orders', content: 'Orders', render: Orders },
      { id: 'settings', content: 'Settings', render: Settings },
    ];

    function Admin() {
      const [sel, setSel] = useState(0);
      const [search, setSearch] = useState('');
      const [menuOpen, setMenuOpen] = useState(false);

      const userMenu = h(TopBar.UserMenu, {
        actions: [], name: 'Collin', detail: 'Wenzel TCG', initials: 'C',
        open: menuOpen, onToggle: () => setMenuOpen(!menuOpen),
      });
      const searchField = h(TopBar.SearchField, {
        onChange: setSearch, value: search, placeholder: 'Search', showFocusBorder: true,
      });
      const topBar = h(TopBar, { showNavigationToggle: false, userMenu, searchField });

      const navMarkup = h(Navigation, { location: '/auction-floor' },
        h(Navigation.Section, {
          items: [
            { label: 'Home', url: '#', onClick: (e) => e && e.preventDefault && e.preventDefault() },
            { label: 'Orders', url: '#', onClick: (e) => e && e.preventDefault && e.preventDefault() },
            { label: 'Products', url: '#', onClick: (e) => e && e.preventDefault && e.preventDefault() },
            { label: 'Customers', url: '#', onClick: (e) => e && e.preventDefault && e.preventDefault() },
            { label: 'Auction Floor', url: '#', selected: true, onClick: (e) => e && e.preventDefault && e.preventDefault() },
            { label: 'Analytics', url: '#', onClick: (e) => e && e.preventDefault && e.preventDefault() },
          ],
        }));

      const content = h(Page, {
        title: 'Auction Floor',
        subtitle: 'Wenzel TCG · live auction app',
        primaryAction: sel === 1 ? { content: 'Schedule show' } : undefined,
      }, h(BlockStack, { gap: '400' }, [
        h(Tabs, { key: 'tabs', tabs: TABS, selected: sel, onSelect: setSel }),
        h(Box, { key: 'panel', paddingBlockStart: '200' }, TABS[sel].render()),
      ]));

      // Authentic Shopify admin shell. Frame normally pins TopBar/Navigation with position:fixed;
      // scoped CSS (injected below) re-anchors them to `absolute` so the whole shell stays inside
      // the embedded box instead of floating over the scrolling deck.
      return h(Frame, { topBar: topBar, navigation: navMarkup }, content);
    }

    const root = createRoot(el);
    root.render(h(AppProvider, { i18n }, h(Admin)));
    el._root = root;
  }

  class WenzelBackOffice extends HTMLElement {
    connectedCallback() {
      if (this._booted) return;
      this._booted = true;
      this.style.display = 'block';
      this.style.height = '100%';
      this.style.background = '#F1F1F1';
      this.innerHTML = '<div style="padding:28px;font-family:Inter,system-ui,sans-serif;color:#6D7175;background:#F1F1F1;height:100%;display:flex;align-items:center;justify-content:center;">Loading Shopify admin…</div>';
      boot(this);
    }
    disconnectedCallback() {
      try { if (this._root) this._root.unmount(); } catch (e) {}
    }
  }
  if (!customElements.get('wenzel-back-office')) {
    customElements.define('wenzel-back-office', WenzelBackOffice);
  }
})();
