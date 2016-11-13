(function ()
{
	function assign(ta)
	{
		var _ref = arguments[1] === undefined ? {} : arguments[1],
				_ref$setOverflowX = _ref.setOverflowX,
				setOverflowX = _ref$setOverflowX === undefined ? true : _ref$setOverflowX,
				_ref$setOverflowY = _ref.setOverflowY,
				setOverflowY = _ref$setOverflowY === undefined ? true : _ref$setOverflowY;

		if (!ta || !ta.nodeName || ta.nodeName !== 'TEXTAREA') return;

		var heightOffset = null,
				overflowY = null,
				clientWidth = ta.clientWidth;

		function init()
		{
			var style = window.getComputedStyle(ta, null);

			overflowY = style.overflowY;

			if (style.resize === 'vertical')
			{
				ta.style.resize = 'none';
			}
			else if (style.resize === 'both')
			{
				ta.style.resize = 'horizontal';
			}

			if (style.boxSizing === 'content-box')
			{
        // NB the minus sign
				heightOffset = -parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
			}
			else
			{
				heightOffset = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
			}

			// Fix when a textarea is not on document body and heightOffset is Not a Number
			if (isNaN(heightOffset))
			{
				heightOffset = 0;
			}

			update();
		}

		function changeOverflow(value)
		{
			{
				// Chrome/Safari-specific fix:
				// When the textarea y-overflow is hidden, Chrome/Safari do not reflow the text to account for the space
				// made available by removing the scrollbar. The following forces the necessary text reflow.
				var width = ta.style.width;
				ta.style.width = '0px';
				// Force reflow:
				/* jshint ignore:start */
				/*ta.offsetWidth;*/
				/* jshint ignore:end */
				ta.style.width = width;
			}

			overflowY = value;

			if (setOverflowY)
			{
				ta.style.overflowY = value;
			}

			resize();
		}

		function resize()
		{
			var htmlTop = window.pageYOffset,
					bodyTop = document.body.scrollTop,
					originalHeight = ta.style.height;

			ta.style.height = 'auto';

			var endHeight = ta.scrollHeight + heightOffset;

			if (ta.scrollHeight === 0)
			{
				// If the scrollHeight is 0, then the element probably has display:none or is detached from the DOM.
				ta.style.height = originalHeight;
				return;
			}

			ta.style.height = endHeight + 'px';

			// used to check if an update is actually necessary on window.resize
			clientWidth = ta.clientWidth;

			// prevents scroll-position jumping
			document.documentElement.scrollTop = htmlTop;
			document.body.scrollTop = bodyTop;
		}

		function update()
    {
			var startHeight = ta.style.height;

			resize();

			var style = window.getComputedStyle(ta, null);

			if (style.height !== ta.style.height)
      {
				if (overflowY !== 'visible')
        {
					changeOverflow('visible');
				}
			}
      else
      {
				if (overflowY !== 'hidden')
        {
					changeOverflow('hidden');
				}
			}

			if (startHeight !== ta.style.height)
      {
				var evt = new Event('autosize:resized');
				ta.dispatchEvent(evt);
			}
		}

		var pageResize = function pageResize()
    {
			if (ta.clientWidth !== clientWidth)
      {
				update();
			}
		};

		window.addEventListener('resize', pageResize, false);
		ta.addEventListener('input', update, false);
		ta.addEventListener('autosize:update', update, false);

		if (setOverflowX)
    {
			ta.style.overflowX = 'hidden';
			ta.style.wordWrap = 'break-word';
		}

		init();
	}

	function update(ta)
  {
		if (!(ta && ta.nodeName && ta.nodeName === 'TEXTAREA')) return;
		var evt = new Event('autosize:update');
		ta.dispatchEvent(evt);
	}

	window.autosize = assign;

})();
