/*
 * Report pagination. Runs in the browser (preview) and in the PDF renderer, so both get the same pages.
 *
 * Every section is written as one flow of units (a heading plus the block after it, or a single block).
 * Each section page is a fixed A4 page with a header, a body and a footer. The body height is set by
 * the page layout, so the script measures the real free space and moves a unit to a new page when it
 * does not fit. No hand-tuned heights.
 *
 * Result: window.reportReady = true and data-report-check on <html>, e.g.
 *   {"units":12,"placed":12,"pages":6,"oversized":0}
 * placed must equal units. oversized > 0 means one unit is taller than a whole page (listed by index).
 */
(function () {
  var sourcesEl = document.getElementById("sources");
  var closingEl = document.querySelector(".closing-page");
  var chevronsTpl = document.getElementById("chevrons-tpl");
  var check = { units: 0, placed: 0, pages: 0, oversized: [] };

  function makePage(source, continued) {
    var page = document.createElement("section");
    page.className = "page section-page";

    var header = document.createElement("div");
    header.className = "header";
    var title = document.createElement("h2");
    title.textContent = source.getAttribute("data-title");
    var number = document.createElement("div");
    number.className = "number";
    number.textContent = continued ? source.getAttribute("data-number") + " (cont.)" : source.getAttribute("data-number");
    header.appendChild(title);
    header.appendChild(number);

    var body = document.createElement("div");
    body.className = "body";

    var footer = document.createElement("div");
    footer.className = "footer";
    var left = document.createElement("span");
    left.textContent = source.getAttribute("data-footer");
    var pageNo = document.createElement("span");
    pageNo.className = "pageno";
    footer.appendChild(left);
    footer.appendChild(pageNo);

    page.appendChild(header);
    page.appendChild(body);
    page.appendChild(chevronsTpl.content.firstElementChild.cloneNode(true));
    page.appendChild(footer);
    closingEl.parentNode.insertBefore(page, closingEl);
    check.pages += 1;
    return { page: page, body: body };
  }

  /**
   * Heading units stay with the unit that follows them. The dashboard link ("more") stays with the
   * unit before it, so it never sits alone on a continuation page.
   */
  function unitsOf(source) {
    var units = [];
    var pending = [];
    Array.prototype.slice.call(source.children).forEach(function (el) {
      if (el.classList.contains("more") && units.length > 0 && pending.length === 0) {
        units[units.length - 1].push(el);
        return;
      }
      pending.push(el);
      if (el.tagName !== "H3") {
        units.push(pending);
        pending = [];
      }
    });
    if (pending.length) units.push(pending);
    return units;
  }

  function fits(body) {
    return body.scrollHeight <= body.clientHeight + 1;
  }

  function paginateSection(source) {
    var units = unitsOf(source);
    check.units += units.length;
    var current = makePage(source, false);

    units.forEach(function (unit, index) {
      unit.forEach(function (el) { current.body.appendChild(el); });
      if (fits(current.body)) {
        check.placed += 1;
        return;
      }
      unit.forEach(function (el) { el.remove(); });
      if (current.body.children.length === 0) {
        // Taller than a whole page on its own: place it anyway and report it.
        unit.forEach(function (el) { current.body.appendChild(el); });
        check.oversized.push(source.getAttribute("data-id") + ":" + index);
        check.placed += 1;
        return;
      }
      current = makePage(source, true);
      unit.forEach(function (el) { current.body.appendChild(el); });
      if (!fits(current.body)) {
        check.oversized.push(source.getAttribute("data-id") + ":" + index);
      }
      check.placed += 1;
    });
    source.remove();
  }

  function run() {
    if (!sourcesEl || !closingEl) {
      window.reportReady = true;
      return;
    }
    Array.prototype.slice.call(sourcesEl.querySelectorAll(".section-source")).forEach(paginateSection);
    sourcesEl.remove();
    document.body.classList.add("paginated");

    var pageNo = 0;
    Array.prototype.slice.call(document.querySelectorAll(".section-page")).forEach(function (page) {
      pageNo += 1;
      page.querySelector(".pageno").textContent = String(pageNo);
    });
    document.documentElement.setAttribute("data-report-check", JSON.stringify(check));
    window.reportReady = true;
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run, run);
  } else {
    run();
  }
})();
