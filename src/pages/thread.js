(() => {
  'use strict';

  function parsePostNum(postEl, fallbackIdx) {
    const raw =
      postEl.dataset.id ||
      postEl.id ||
      (postEl.querySelector('.postid') ? postEl.querySelector('.postid').textContent : '');
    const num = parseInt(String(raw).replace(/[^\d]/g, ''), 10);
    return Number.isFinite(num) && num > 0 ? num : fallbackIdx + 1;
  }

  function parseReplyCount(postEl) {
    const sum = postEl.querySelector('.post-replies > summary');
    if (!sum) return 0;
    const m = (sum.textContent || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function extractTargetNumsFromAnchor(text) {
    const clean = String(text || '').trim();
    const nums = [];
    const rangeMatch = clean.match(/^>>(\d+)\s*[-~〜]\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = Math.min(parseInt(rangeMatch[2], 10), start + 5);
      for (let n = start; n <= end; n += 1) nums.push(n);
      return nums;
    }
    const matches = clean.match(/\d+/g);
    if (matches) {
      matches.slice(0, 5).forEach((s) => {
        const n = parseInt(s, 10);
        if (Number.isFinite(n) && n > 0) nums.push(n);
      });
    }
    return nums;
  }

  function cleanPostSnippet(contentEl, maxLen = 115) {
    if (!contentEl) return '';
    const clone = contentEl.cloneNode(true);
    clone
      .querySelectorAll('.cn5ch-injected, .cn5ch-quote-dedup, a.image-thumb, .image-blurred, .image-inline')
      .forEach((n) => n.remove());
    let text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    text = text.replace(/^(?:>>\d+(?:-\d+)?\s*)+/g, '').trim() || text;
    if (text.length > maxLen) {
      return `${text.slice(0, maxLen)}…`;
    }
    return text;
  }

  // Deduplicate leading >>N anchor lines that are already represented by the single Quote Card above
  function hideLeadingQuoteAnchors(contentEl) {
    let cursor = contentEl.firstChild;
    let hidAny = false;

    while (cursor) {
      if (cursor.nodeType === Node.TEXT_NODE) {
        if (/^[\s,、/]*$/.test(cursor.textContent || '')) {
          cursor = cursor.nextSibling;
          continue;
        }
        break;
      }

      if (cursor.nodeType === Node.ELEMENT_NODE) {
        if (cursor.matches('a.reply_link')) {
          cursor.classList.add('cn5ch-quote-dedup');
          hidAny = true;
          cursor = cursor.nextSibling;
          continue;
        }
        if (hidAny && cursor.tagName === 'BR') {
          cursor.classList.add('cn5ch-quote-dedup');
          cursor = cursor.nextSibling;
          // Only strip one consecutive line break after the leading >>N block
          if (cursor && cursor.nodeType === Node.ELEMENT_NODE && cursor.tagName === 'BR') {
            cursor.classList.add('cn5ch-quote-dedup');
            cursor = cursor.nextSibling;
          }
          continue;
        }
      }
      break;
    }
  }

  function insertQuoteIntoReplyForm(floorNum) {
    const formBox = document.querySelector('.formbox, form[action*="bbs.cgi"]');
    if (!formBox) {
      window.CN5CH.utils.showToast(`未找到回帖框（>>${floorNum}）`);
      return;
    }
    const textarea = formBox.querySelector('textarea[name="MESSAGE"]');
    if (textarea) {
      const prefix = textarea.value && !textarea.value.endsWith('\n') ? '\n' : '';
      textarea.value = `${textarea.value}${prefix}>>${floorNum}\n`;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      formBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      textarea.focus();
      window.CN5CH.utils.showToast(`已引用 ${floorNum}F`);
    }
  }

  function jumpToFloor(postEl) {
    if (!postEl) return;
    postEl.classList.remove('cn5ch-filtered-out');
    postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // restart the flash even when jumping to the same floor twice in a row
    postEl.classList.remove('cn5ch-jump-flash');
    void postEl.offsetWidth;
    postEl.classList.add('cn5ch-jump-flash');
    clearTimeout(postEl.__cn5chFlashTimer);
    postEl.__cn5chFlashTimer = setTimeout(() => postEl.classList.remove('cn5ch-jump-flash'), 1300);
  }

  function transformThread(settings) {
    const {
      el,
      svgIcon,
      setText,
      avatarTone,
      avatarLabel,
      attachSlidingIndicator,
      unwrapLinksInContainer,
      isDirectImageUrl,
      extractUidText,
      showToast
    } = window.CN5CH.utils;
    const { ensureLightbox, ensureQuotePopup, floorMeta } = window.CN5CH.components;
    const countEl = (n) => el('span', { className: 'cn5ch-count notranslate', translate: 'no', text: String(n) });

    const threadRoot = document.getElementById('threadcontent') || document.body;
    const postNodes = Array.from(threadRoot.querySelectorAll('.post'));
    if (!postNodes.length) return;

    const lightbox = ensureLightbox();
    const quotePopup = ensureQuotePopup();

    // First pass: index posts, OP ID, outgoing reply targets & incoming sub-replies
    const postMap = new Map();
    const incomingMap = new Map();
    let opUid = '';

    postNodes.forEach((postEl, idx) => {
      const num = parsePostNum(postEl, idx);
      const uidEl = postEl.querySelector('.uid');
      const uid = extractUidText(uidEl);
      if (num === 1 && uid && !/ID:\?{3}/.test(uid)) {
        opUid = uid;
      }

      const contentEl = postEl.querySelector('.post-content');
      const replyTargets = [];
      const seenTargets = new Set();

      if (contentEl) {
        unwrapLinksInContainer(contentEl, settings.unwrapJumpLinks);
        contentEl.querySelectorAll('a.reply_link').forEach((a) => {
          const origText = a.dataset.cn5chOrigText || a.textContent.trim();
          const nums = extractTargetNumsFromAnchor(origText);
          nums.forEach((tNum) => {
            if (tNum !== num && !seenTargets.has(tNum)) {
              seenTargets.add(tNum);
              replyTargets.push({ num: tNum, href: a.href || '' });
              if (!incomingMap.has(tNum)) incomingMap.set(tNum, []);
              incomingMap.get(tNum).push(num);
            }
          });
        });
      }

      const authorEl = postEl.querySelector('.postusername');
      const dateEl = postEl.querySelector('.post-meta .date, time.date');
      const nativeReplies = parseReplyCount(postEl);

      postMap.set(num, {
        num,
        el: postEl,
        uid,
        author: authorEl ? authorEl.textContent.trim() : '匿名',
        date: dateEl ? dateEl.textContent.trim() : '',
        nativeReplies,
        contentEl,
        replyTargets,
        incomingNums: [],
        hasImages: false,
        isOp: false,
        replyCount: nativeReplies
      });
    });

    let opCount = 0;
    let hotCount = 0;
    let imgPostCount = 0;

    postMap.forEach((info) => {
      const incoming = incomingMap.get(info.num) || [];
      info.incomingNums = incoming;
      info.replyCount = Math.max(info.nativeReplies, incoming.length);
      info.isOp = info.num === 1 || (Boolean(opUid) && info.uid === opUid);
      if (info.isOp) opCount += 1;
      if (info.replyCount >= 2 && info.num !== 1) hotCount += 1;
    });

    const filterState = {
      mode: 'all',
      uid: '',
      keyword: ''
    };

    let activeUidChip = null;
    let syncFilterSlider = () => {};
    const modeButtons = {};

    function applyPostFilters() {
      const kw = filterState.keyword.trim().toLowerCase();
      postMap.forEach((info) => {
        let visible = true;
        if (filterState.mode === 'op' && !info.isOp) visible = false;
        if (filterState.mode === 'hot' && !(info.replyCount >= 2 && info.num !== 1)) visible = false;
        if (filterState.mode === 'img' && !info.hasImages) visible = false;
        if (visible && filterState.uid && info.uid !== filterState.uid) visible = false;
        if (visible && kw) {
          const hay = `${info.author} ${info.uid} ${info.contentEl ? info.contentEl.textContent : ''}`.toLowerCase();
          if (!hay.includes(kw)) visible = false;
        }
        info.el.classList.toggle('cn5ch-filtered-out', !visible);

        const uidBtn = info.el.querySelector('.uid');
        if (uidBtn) {
          uidBtn.classList.toggle('is-filtered', Boolean(filterState.uid) && info.uid === filterState.uid);
        }
      });

      Object.entries(modeButtons).forEach(([key, btn]) => {
        btn.classList.toggle('is-active', filterState.mode === key);
      });
      requestAnimationFrame(syncFilterSlider);

      if (activeUidChip) {
        if (filterState.uid) {
          activeUidChip.style.display = 'inline-flex';
          setText(activeUidChip, `只看 ${filterState.uid} ×`);
        } else {
          activeUidChip.style.display = 'none';
        }
      }
    }

    function bindQuoteHover(triggerEl, targetNum) {
      triggerEl.addEventListener('mouseenter', () => {
        const target = postMap.get(targetNum);
        const rect = triggerEl.getBoundingClientRect();
        if (target) {
          quotePopup.show(rect, {
            num: target.num,
            isOp: target.isOp,
            author: target.author,
            date: target.date,
            uid: target.uid,
            contentNode: target.contentEl
          });
        } else {
          quotePopup.show(rect, {
            num: targetNum,
            isOp: false,
            author: '不在本页',
            text: `${targetNum}F 不在本页，点击跳转查看`
          });
        }
      });
      triggerEl.addEventListener('mouseleave', () => {
        quotePopup.scheduleHide();
      });
    }

    function navigateToFloor(targetNum, fallbackHref, ev) {
      const target = postMap.get(targetNum);
      if (target) {
        if (ev) ev.preventDefault();
        jumpToFloor(target.el);
      } else if (fallbackHref) {
        window.location.href = fallbackHref;
      } else {
        showToast(`${targetNum}F 不在本页，请切换到「全部」查看`);
      }
    }

    // Second pass: craft shadcn/ui + Magic UI Spotlight cards with ONE single Quote Callout
    postMap.forEach((info) => {
      const postEl = info.el;
      if (postEl.dataset.cn5chEnhanced === '1') return;
      postEl.dataset.cn5chEnhanced = '1';

      if (info.isOp) {
        postEl.classList.add('cn5ch-is-op');
      }

      const headerEl = postEl.querySelector('.post-header');
      const contentEl = info.contentEl;

      // 1. Minimal top header: Avatar + Author/Badges/ID + clean Floor pill ONLY (no duplicate reply pill!)
      if (headerEl) {
        const authorNameEl = headerEl.querySelector('.postusername');
        const dateEl = headerEl.querySelector('.post-meta .date, time.date');
        const uidBtn = headerEl.querySelector('.uid');
        const beEl = headerEl.querySelector('.be');
        const menuEl = headerEl.querySelector('.post-menu');
        const isSage = Boolean(headerEl.querySelector('a[href="mailto:sage"]'));

        const avatarSeed = info.uid && !/ID:\?{3}/.test(info.uid) ? info.uid : `${info.author}-${info.num}`;
        const tone = avatarTone(avatarSeed);
        const avatar = el('div', {
          className: 'cn5ch-avatar cn5ch-injected notranslate',
          translate: 'no',
          style: { backgroundColor: tone.bg, color: tone.fg },
          text: avatarLabel(info.author, info.uid)
        });

        const line1 = el('div', { className: 'cn5ch-author-line1' });
        if (authorNameEl) line1.appendChild(authorNameEl);
        if (info.isOp) {
          line1.appendChild(el('span', { className: 'cn5ch-badge cn5ch-badge-op notranslate', translate: 'no', text: '楼主' }));
        }
        if (info.replyCount >= 3 && info.num !== 1) {
          line1.appendChild(
            el('span', { className: 'cn5ch-badge cn5ch-badge-hot notranslate', translate: 'no' }, [
              svgIcon('flame', 11),
              `亮评 ${info.replyCount}`
            ])
          );
        }
        if (isSage) {
          line1.appendChild(el('span', { className: 'cn5ch-badge cn5ch-badge-sage notranslate', translate: 'no', text: 'sage' }));
        }
        if (uidBtn) {
          uidBtn.setAttribute('translate', 'no');
          uidBtn.classList.add('notranslate');
          if (info.uid) {
            uidBtn.dataset.cn5chTip = '点击切换「只看该作者」';
            uidBtn.addEventListener('click', (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              if (filterState.uid === info.uid) {
                filterState.uid = '';
                showToast('已取消作者筛选');
              } else {
                filterState.uid = info.uid;
                showToast(`只看该作者：${info.uid}`);
              }
              applyPostFilters();
            });
          }
          line1.appendChild(uidBtn);
        }

        const line2 = el('div', { className: 'cn5ch-author-line2' });
        if (dateEl) line2.appendChild(dateEl);
        if (beEl) line2.appendChild(beEl);
        if (menuEl) line2.appendChild(menuEl);

        const leftGroup = el('div', { className: 'cn5ch-author-left' }, [
          avatar,
          el('div', { className: 'cn5ch-author-info' }, [line1, line2])
        ]);

        // Keep top-right super minimal: Floor number ONLY
        const rightGroup = el('div', { className: 'cn5ch-floor-right' }, [
          el('span', {
            className: 'cn5ch-floor-pill cn5ch-injected notranslate',
            translate: 'no',
            text: info.num === 1 ? '1F · 楼主' : `${info.num}F`
          })
        ]);

        headerEl.prepend(leftGroup);
        headerEl.appendChild(rightGroup);
      }

      // 2. Content processing: ONE single Quote Card + deduplicate leading >>N + clean media gallery
      if (contentEl) {
        // Bind hover preview & smooth jump on any remaining inline >>N links (WITHOUT turning them into ugly duplicate pills!)
        contentEl.querySelectorAll('a.reply_link').forEach((a) => {
          const origText = a.dataset.cn5chOrigText || a.textContent.trim();
          a.dataset.cn5chOrigText = origText;
          const nums = extractTargetNumsFromAnchor(origText);
          if (!nums.length) return;
          a.setAttribute('translate', 'no');
          a.classList.add('notranslate');
          bindQuoteHover(a, nums[0]);
          a.addEventListener('click', (ev) => navigateToFloor(nums[0], a.href, ev));
        });

        // Insert ONLY ONE clean Quote Card above .post-content & hide redundant leading >>N in body
        if (info.replyTargets.length > 0) {
          hideLeadingQuoteAnchors(contentEl);

          const primary = info.replyTargets[0];
          const extras = info.replyTargets.slice(1, 5);
          const target = postMap.get(primary.num);
          const snippet = target
            ? cleanPostSnippet(target.contentEl, 115) || '（图片或表情回复）'
            : `${primary.num}F 不在本页，点击跳转查看`;

          const whoParts = [
            svgIcon('cornerDownRight', 13),
            el('span', { text: '回复' }),
            floorMeta({ num: primary.num, isOp: Boolean(target && target.isOp), author: target ? target.author : '' })
          ];

          extras.forEach((ex) => {
            const chip = el('button', {
              type: 'button',
              className: 'cn5ch-quote-extra-chip notranslate',
              translate: 'no',
              text: `+${ex.num}F`,
              onClick: (ev) => {
                ev.stopPropagation();
                navigateToFloor(ex.num, ex.href, ev);
              }
            });
            bindQuoteHover(chip, ex.num);
            whoParts.push(chip);
          });

          const quoteCard = el(
            'div',
            {
              className: 'cn5ch-quote-card cn5ch-injected',
              onClick: (ev) => navigateToFloor(primary.num, primary.href, ev)
            },
            [
              el('div', { className: 'cn5ch-quote-card-head' }, [
                el('span', { className: 'cn5ch-quote-card-who' }, whoParts),
                el('span', { className: 'cn5ch-quote-card-jump' }, ['跳转', svgIcon('arrowUpRight', 13)])
              ]),
              el('div', { className: 'cn5ch-quote-card-text', text: snippet })
            ]
          );
          bindQuoteHover(quoteCard, primary.num);
          contentEl.parentNode.insertBefore(quoteCard, contentEl);
        }

        // Collect clean image URLs (ignore duplicate native a.image-thumb blurred squares)
        const imgUrls = new Set();
        if (settings.inlineImages) {
          contentEl.querySelectorAll('a[href]:not(.image-thumb)').forEach((a) => {
            const dataImg = a.dataset && a.dataset.image ? a.dataset.image.trim() : '';
            const href = a.href || a.getAttribute('href') || '';
            if (dataImg && /^https?:\/\//i.test(dataImg)) {
              imgUrls.add(dataImg);
            } else if (isDirectImageUrl(href)) {
              imgUrls.add(href);
            }
          });
        }

        const hasNonIconImg = Boolean(
          contentEl.querySelector('img:not([src*="/ico/"]):not(.image-thumb img)') || imgUrls.size > 0
        );
        if (hasNonIconImg) {
          info.hasImages = true;
          imgPostCount += 1;
        }

        if (imgUrls.size > 0) {
          const gallery = el(
            'div',
            { className: 'cn5ch-inline-gallery cn5ch-injected' },
            Array.from(imgUrls)
              .slice(0, 8)
              .map((url) =>
                el(
                  'div',
                  {
                    className: 'cn5ch-inline-thumb-wrap',
                    onClick: () => lightbox.open(url)
                  },
                  [
                    el('img', {
                      className: 'cn5ch-inline-thumb',
                      src: url,
                      loading: 'lazy',
                      referrerpolicy: 'no-referrer',
                      alt: '帖子附图',
                      onError: (ev) => {
                        const wrap = ev.target.closest('.cn5ch-inline-thumb-wrap');
                        if (wrap) wrap.style.display = 'none';
                      }
                    })
                  ]
                )
              )
          );
          contentEl.appendChild(gallery);
        }
      }

      // 3. Bottom Footer: Sub-Replies Bar + Animate UI Icon Buttons
      const repliesBar = el('div', { className: 'cn5ch-replies-bar' });
      let subRepliesWrap = null;

      if (info.incomingNums.length > 0 || info.replyCount > 0) {
        const shownCount = info.incomingNums.length || info.replyCount;
        repliesBar.appendChild(
          el('span', { className: 'cn5ch-badge cn5ch-badge-new notranslate', translate: 'no' }, [
            svgIcon('messageSquare', 11),
            `${shownCount} 回复`
          ])
        );

        info.incomingNums.slice(0, 6).forEach((childNum) => {
          const chip = el('button', {
            type: 'button',
            className: 'cn5ch-reply-chip notranslate',
            translate: 'no',
            onClick: (ev) => navigateToFloor(childNum, '', ev)
          }, [`${childNum}F`, svgIcon('arrowUpRight', 11)]);
          bindQuoteHover(chip, childNum);
          repliesBar.appendChild(chip);
        });

        if (info.incomingNums.length > 0) {
          let expanded = false;
          const subRepliesBox = el('div', { className: 'cn5ch-subreplies-box' });
          subRepliesWrap = el('div', { className: 'cn5ch-subreplies-wrap cn5ch-injected' }, [
            el('div', { className: 'cn5ch-subreplies-inner' }, [subRepliesBox])
          ]);

          const chevron = svgIcon('chevronDown', 12);
          chevron.style.transition = 'transform 0.22s var(--cn-ease-spring)';
          const toggleLabel = el('span', { text: '展开楼中楼' });

          const toggleSubBtn = el(
            'button',
            {
              type: 'button',
              className: 'cn5ch-reply-chip',
              onClick: () => {
                expanded = !expanded;
                if (expanded && !subRepliesBox.childElementCount) {
                  info.incomingNums.forEach((childNum) => {
                    const childPost = postMap.get(childNum);
                    if (!childPost) return;
                    subRepliesBox.appendChild(
                      el('div', { className: 'cn5ch-subreply-item' }, [
                        el('div', { className: 'cn5ch-subreply-head' }, [
                          floorMeta(childPost),
                          el(
                            'button',
                            {
                              type: 'button',
                              className: 'cn5ch-reply-chip',
                              onClick: (ev) => navigateToFloor(childPost.num, '', ev)
                            },
                            ['跳转', svgIcon('arrowUpRight', 11)]
                          )
                        ]),
                        el('div', {
                          className: 'cn5ch-subreply-body',
                          text: cleanPostSnippet(childPost.contentEl, 240)
                        })
                      ])
                    );
                  });
                }
                subRepliesWrap.classList.toggle('is-open', expanded);
                chevron.style.transform = expanded ? 'rotate(180deg)' : 'rotate(0deg)';
                setText(toggleLabel, expanded ? '收起楼中楼' : '展开楼中楼');
              }
            },
            [toggleLabel, chevron]
          );
          repliesBar.appendChild(toggleSubBtn);
        }
      }

      // Animate UI Copy Button (morphs smoothly into green Check icon on click!)
      const copyIconWrap = el('span', { style: { display: 'inline-flex' } }, [svgIcon('copy', 13)]);
      const copyTextEl = el('span', { text: '复制' });
      let copyResetTimer = null;

      const copyBtn = el(
        'button',
        {
          type: 'button',
          className: 'cn5ch-mini-action',
          onClick: () => {
            const txt = cleanPostSnippet(contentEl, 5000);
            const finishCopied = () => {
              copyBtn.classList.add('is-copied');
              copyIconWrap.replaceChildren(svgIcon('check', 13));
              setText(copyTextEl, '已复制');
              clearTimeout(copyResetTimer);
              copyResetTimer = setTimeout(() => {
                copyBtn.classList.remove('is-copied');
                copyIconWrap.replaceChildren(svgIcon('copy', 13));
                setText(copyTextEl, '复制');
              }, 1600);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(txt).then(finishCopied);
            } else {
              showToast('浏览器不支持剪贴板写入');
            }
          }
        },
        [copyIconWrap, copyTextEl]
      );

      const replyBtn = el(
        'button',
        {
          type: 'button',
          className: 'cn5ch-mini-action',
          onClick: () => insertQuoteIntoReplyForm(info.num)
        },
        [svgIcon('reply', 13), el('span', { text: '回复' })]
      );

      const footer = el('div', { className: 'cn5ch-post-footer cn5ch-injected' }, [
        repliesBar,
        el('div', { className: 'cn5ch-floor-actions' }, [replyBtn, copyBtn])
      ]);

      postEl.appendChild(footer);
      if (subRepliesWrap) {
        postEl.appendChild(subRepliesWrap);
      }
    });

    // 3. Thread Toolbar with Motion Primitives Sliding Pill Filter Tabs
    const titleEl = document.getElementById('threadtitle') || threadRoot.querySelector('h1');
    if (titleEl && !threadRoot.querySelector('.cn5ch-thread-toolbar')) {
      modeButtons.all = el('button', {
        type: 'button',
        className: 'cn5ch-tab-pill is-active',
        onClick: () => {
          filterState.mode = 'all';
          applyPostFilters();
        }
      }, ['全部', countEl(postMap.size)]);

      modeButtons.op = el('button', {
        type: 'button',
        className: 'cn5ch-tab-pill',
        onClick: () => {
          filterState.mode = filterState.mode === 'op' ? 'all' : 'op';
          applyPostFilters();
        }
      }, ['只看楼主', countEl(opCount)]);

      modeButtons.hot = el('button', {
        type: 'button',
        className: 'cn5ch-tab-pill',
        onClick: () => {
          filterState.mode = filterState.mode === 'hot' ? 'all' : 'hot';
          applyPostFilters();
        }
      }, [svgIcon('flame', 13), '亮评', countEl(hotCount)]);

      modeButtons.img = el('button', {
        type: 'button',
        className: 'cn5ch-tab-pill',
        onClick: () => {
          filterState.mode = filterState.mode === 'img' ? 'all' : 'img';
          applyPostFilters();
        }
      }, ['带图', countEl(imgPostCount)]);

      const tabGroup = el('div', { className: 'cn5ch-tab-group', role: 'tablist' }, [
        modeButtons.all,
        modeButtons.op,
        modeButtons.hot,
        modeButtons.img
      ]);

      activeUidChip = el('button', {
        type: 'button',
        className: 'cn5ch-btn cn5ch-btn-primary notranslate',
        translate: 'no',
        style: { display: 'none' },
        onClick: () => {
          filterState.uid = '';
          applyPostFilters();
        }
      });

      const searchInput = el('input', {
        type: 'search',
        placeholder: '筛选本帖内容 / ID…',
        onInput: (ev) => {
          filterState.keyword = ev.target.value || '';
          applyPostFilters();
        }
      });

      const jumpReplyBtn = el(
        'button',
        {
          type: 'button',
          className: 'cn5ch-btn cn5ch-btn-primary',
          onClick: () => {
            const box = document.querySelector('.formbox, form[action*="bbs.cgi"]');
            if (box) {
              box.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const ta = box.querySelector('textarea[name="MESSAGE"]');
              if (ta) ta.focus();
            }
          }
        },
        [svgIcon('messageSquare', 13), el('span', { text: '快速回帖' })]
      );

      const toolbar = el('div', { className: 'cn5ch-thread-toolbar cn5ch-injected' }, [
        el('div', { className: 'cn5ch-thread-filters' }, [tabGroup, activeUidChip]),
        el('div', { className: 'cn5ch-thread-search' }, [searchInput, jumpReplyBtn])
      ]);

      titleEl.insertAdjacentElement('afterend', toolbar);
      syncFilterSlider = attachSlidingIndicator(tabGroup, '.cn5ch-tab-pill.is-active');

      // 4. Hot Replies Section
      const hotPosts = Array.from(postMap.values())
        .filter((p) => p.num !== 1 && p.replyCount >= 2)
        .sort((a, b) => b.replyCount - a.replyCount)
        .slice(0, 6);

      if (hotPosts.length > 0) {
        const hotList = el(
          'div',
          { className: 'cn5ch-hot-list' },
          hotPosts.map((p) => {
            const item = el(
              'div',
              {
                className: 'cn5ch-hot-item',
                onClick: () => jumpToFloor(p.el)
              },
              [
                el('div', { className: 'cn5ch-hot-item-meta' }, [
                  floorMeta({ num: p.num, author: p.author }),
                  el('span', { className: 'cn5ch-badge cn5ch-badge-hot notranslate', translate: 'no' }, [
                    svgIcon('flame', 11),
                    `${p.replyCount} 回复`
                  ])
                ]),
                el('div', {
                  className: 'cn5ch-hot-item-text',
                  text: cleanPostSnippet(p.contentEl, 110)
                })
              ]
            );
            return item;
          })
        );

        let collapsed = false;
        const collapseBtn = el('button', {
          type: 'button',
          className: 'cn5ch-mini-action',
          text: '收起',
          onClick: () => {
            collapsed = !collapsed;
            hotList.style.display = collapsed ? 'none' : '';
            setText(collapseBtn, collapsed ? '展开' : '收起');
          }
        });

        const hotSection = el('section', { className: 'cn5ch-card cn5ch-hot-section cn5ch-injected' }, [
          el('div', { className: 'cn5ch-hot-header' }, [
            el('span', { className: 'cn5ch-hot-title' }, [svgIcon('flame', 14), '本帖亮评', countEl(hotPosts.length)]),
            collapseBtn
          ]),
          hotList
        ]);

        toolbar.insertAdjacentElement('afterend', hotSection);
      }
    }

    // 5. Enhance Reply Form Header
    const formBox = document.querySelector('.formbox');
    if (formBox && !formBox.querySelector('.cn5ch-reply-title')) {
      formBox.prepend(el('div', { className: 'cn5ch-reply-title cn5ch-injected', text: '发表回复' }));
    }
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.pages = window.CN5CH.pages || {};
  window.CN5CH.pages.thread = transformThread;
})();
