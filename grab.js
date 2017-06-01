//! grab.js
//! version : 1.0.0
//! authors : mzh
//! license : MIT
//! des ：客户端统计

var UUID = (function(overwrittenUUID) {
	"use strict";

	// Core Component {{{

	/** @lends UUID */
	function UUID() {}

	/**
	 * The simplest function to get an UUID string.
	 * @returns {string} A version 4 UUID string.
	 */
	UUID.generate = function() {
		var rand = UUID._getRandomInt,
			hex = UUID._hexAligner;
		return hex(rand(32), 8) // time_low
			+
			"-" +
			hex(rand(16), 4) // time_mid
			+
			"-" +
			hex(0x4000 | rand(12), 4) // time_hi_and_version
			+
			"-" +
			hex(0x8000 | rand(14), 4) // clock_seq_hi_and_reserved clock_seq_low
			+
			"-" +
			hex(rand(48), 12); // node
	};

	/**
	 * Returns an unsigned x-bit random integer.
	 * @param {int} x A positive integer ranging from 0 to 53, inclusive.
	 * @returns {int} An unsigned x-bit random integer (0 <= f(x) < 2^x).
	 */
	UUID._getRandomInt = function(x) {
		if(x < 0) return NaN;
		if(x <= 30) return(0 | Math.random() * (1 << x));
		if(x <= 53) return(0 | Math.random() * (1 << 30)) +
			(0 | Math.random() * (1 << x - 30)) * (1 << 30);
		return NaN;
	};

	/**
	 * Returns a function that converts an integer to a zero-filled string.
	 * @param {int} radix
	 * @returns {function(num&#44; length)}
	 */
	UUID._getIntAligner = function(radix) {
		return function(num, length) {
			var str = num.toString(radix),
				i = length - str.length,
				z = "0";
			for(; i > 0; i >>>= 1, z += z) {
				if(i & 1) {
					str = z + str;
				}
			}
			return str;
		};
	};

	UUID._hexAligner = UUID._getIntAligner(16);

	// }}}

	// UUID Object Component {{{

	/**
	 * Names of each UUID field.
	 * @type string[]
	 * @constant
	 * @since 3.0
	 */
	UUID.FIELD_NAMES = ["timeLow", "timeMid", "timeHiAndVersion",
		"clockSeqHiAndReserved", "clockSeqLow", "node"
	];

	/**
	 * Sizes of each UUID field.
	 * @type int[]
	 * @constant
	 * @since 3.0
	 */
	UUID.FIELD_SIZES = [32, 16, 16, 8, 8, 48];

	/**
	 * Generates a version 4 {@link UUID}.
	 * @returns {UUID} A version 4 {@link UUID} object.
	 * @since 3.0
	 */
	UUID.genV4 = function() {
		var rand = UUID._getRandomInt;
		return new UUID()._init(rand(32), rand(16), // time_low time_mid
			0x4000 | rand(12), // time_hi_and_version
			0x80 | rand(6), // clock_seq_hi_and_reserved
			rand(8), rand(48)); // clock_seq_low node
	};

	/**
	 * Converts hexadecimal UUID string to an {@link UUID} object.
	 * @param {string} strId UUID hexadecimal string representation ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").
	 * @returns {UUID} {@link UUID} object or null.
	 * @since 3.0
	 */
	UUID.parse = function(strId) {
		var r, p = /^\s*(urn:uuid:|\{)?([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{2})([0-9a-f]{2})-([0-9a-f]{12})(\})?\s*$/i;
		if(r = p.exec(strId)) {
			var l = r[1] || "",
				t = r[8] || "";
			if(((l + t) === "") ||
				(l === "{" && t === "}") ||
				(l.toLowerCase() === "urn:uuid:" && t === "")) {
				return new UUID()._init(parseInt(r[2], 16), parseInt(r[3], 16),
					parseInt(r[4], 16), parseInt(r[5], 16),
					parseInt(r[6], 16), parseInt(r[7], 16));
			}
		}
		return null;
	};

	/**
	 * Initializes {@link UUID} object.
	 * @param {uint32} [timeLow=0] time_low field (octet 0-3).
	 * @param {uint16} [timeMid=0] time_mid field (octet 4-5).
	 * @param {uint16} [timeHiAndVersion=0] time_hi_and_version field (octet 6-7).
	 * @param {uint8} [clockSeqHiAndReserved=0] clock_seq_hi_and_reserved field (octet 8).
	 * @param {uint8} [clockSeqLow=0] clock_seq_low field (octet 9).
	 * @param {uint48} [node=0] node field (octet 10-15).
	 * @returns {UUID} this.
	 */
	UUID.prototype._init = function() {
		var names = UUID.FIELD_NAMES,
			sizes = UUID.FIELD_SIZES;
		var bin = UUID._binAligner,
			hex = UUID._hexAligner;

		/**
		 * List of UUID field values (as integer values).
		 * @type int[]
		 */
		this.intFields = new Array(6);

		/**
		 * List of UUID field values (as binary bit string values).
		 * @type string[]
		 */
		this.bitFields = new Array(6);

		/**
		 * List of UUID field values (as hexadecimal string values).
		 * @type string[]
		 */
		this.hexFields = new Array(6);

		for(var i = 0; i < 6; i++) {
			var intValue = parseInt(arguments[i] || 0);
			this.intFields[i] = this.intFields[names[i]] = intValue;
			this.bitFields[i] = this.bitFields[names[i]] = bin(intValue, sizes[i]);
			this.hexFields[i] = this.hexFields[names[i]] = hex(intValue, sizes[i] / 4);
		}

		/**
		 * UUID version number defined in RFC 4122.
		 * @type int
		 */
		this.version = (this.intFields.timeHiAndVersion >> 12) & 0xF;

		/**
		 * 128-bit binary bit string representation.
		 * @type string
		 */
		this.bitString = this.bitFields.join("");

		/**
		 * Non-delimited hexadecimal string representation ("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx").
		 * @type string
		 * @since v3.3.0
		 */
		this.hexNoDelim = this.hexFields.join("");

		/**
		 * UUID hexadecimal string representation ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").
		 * @type string
		 */
		this.hexString = this.hexFields[0] + "-" + this.hexFields[1] + "-" + this.hexFields[2] +
			"-" + this.hexFields[3] + this.hexFields[4] + "-" + this.hexFields[5];

		/**
		 * UUID string representation as a URN ("urn:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").
		 * @type string
		 */
		this.urn = "urn:uuid:" + this.hexString;

		return this;
	};

	UUID._binAligner = UUID._getIntAligner(2);

	/**
	 * Returns UUID string representation.
	 * @returns {string} {@link UUID#hexString}.
	 */
	UUID.prototype.toString = function() {
		return this.hexString;
	};

	/**
	 * Tests if two {@link UUID} objects are equal.
	 * @param {UUID} uuid
	 * @returns {bool} True if two {@link UUID} objects are equal.
	 */
	UUID.prototype.equals = function(uuid) {
		if(!(uuid instanceof UUID)) {
			return false;
		}
		for(var i = 0; i < 6; i++) {
			if(this.intFields[i] !== uuid.intFields[i]) {
				return false;
			}
		}
		return true;
	};

	// }}}

	// UUID Version 1 Component {{{

	/**
	 * Generates a version 1 {@link UUID}.
	 * @returns {UUID} A version 1 {@link UUID} object.
	 * @since 3.0
	 */
	UUID.genV1 = function() {
		var now = new Date().getTime(),
			st = UUID._state;
		if(now != st.timestamp) {
			if(now < st.timestamp) {
				st.sequence++;
			}
			st.timestamp = now;
			st.tick = UUID._getRandomInt(4);
		} else if(Math.random() < UUID._tsRatio && st.tick < 9984) {
			// advance the timestamp fraction at a probability
			// to compensate for the low timestamp resolution
			st.tick += 1 + UUID._getRandomInt(4);
		} else {
			st.sequence++;
		}

		// format time fields
		var tf = UUID._getTimeFieldValues(st.timestamp);
		var tl = tf.low + st.tick;
		var thav = (tf.hi & 0xFFF) | 0x1000; // set version '0001'

		// format clock sequence
		st.sequence &= 0x3FFF;
		var cshar = (st.sequence >>> 8) | 0x80; // set variant '10'
		var csl = st.sequence & 0xFF;

		return new UUID()._init(tl, tf.mid, thav, cshar, csl, st.node);
	};

	/**
	 * Re-initializes version 1 UUID state.
	 * @since 3.0
	 */
	UUID.resetState = function() {
		UUID._state = new UUID._state.constructor();
	};

	/**
	 * Probability to advance the timestamp fraction: the ratio of tick movements to sequence increments.
	 * @type float
	 */
	UUID._tsRatio = 1 / 4;

	/**
	 * Persistent state for UUID version 1.
	 * @type UUIDState
	 */
	UUID._state = new function UUIDState() {
		var rand = UUID._getRandomInt;
		this.timestamp = 0;
		this.sequence = rand(14);
		this.node = (rand(8) | 1) * 0x10000000000 + rand(40); // set multicast bit '1'
		this.tick = rand(4); // timestamp fraction smaller than a millisecond
	};

	/**
	 * @param {Date|int} time ECMAScript Date Object or milliseconds from 1970-01-01.
	 * @returns {object}
	 */
	UUID._getTimeFieldValues = function(time) {
		var ts = time - Date.UTC(1582, 9, 15);
		var hm = ((ts / 0x100000000) * 10000) & 0xFFFFFFF;
		return {
			low: ((ts & 0xFFFFFFF) * 10000) % 0x100000000,
			mid: hm & 0xFFFF,
			hi: hm >>> 16,
			timestamp: ts
		};
	};

	// }}}

	// Misc. Component {{{

	/**
	 * Reinstalls {@link UUID.generate} method to emulate the interface of UUID.js version 2.x.
	 * @since 3.1
	 * @deprecated Version 2.x. compatible interface is not recommended.
	 */
	UUID.makeBackwardCompatible = function() {
		var f = UUID.generate;
		UUID.generate = function(o) {
			return(o && o.version == 1) ? UUID.genV1().hexString : f.call(UUID);
		};
		UUID.makeBackwardCompatible = function() {};
	};

	/**
	 * Preserves the value of 'UUID' global variable set before the load of UUID.js.
	 * @since 3.2
	 * @type object
	 */
	UUID.overwrittenUUID = overwrittenUUID;

	// }}}

	return UUID;

})(UUID);

var Device = (function() {
	(function(root, undefined) {
		var detect = root.detect = (function() {

			// Regular Expressions
			var regexes = {
				"user_agent_parsers": [{
					"regex": "^(Opera)/(\\d+)\\.(\\d+) \\(Nintendo Wii",
					"family_replacement": "Wii"
				}, {
					"regex": "(SeaMonkey|Camino)/(\\d+)\\.(\\d+)\\.?([ab]?\\d+[a-z]*)"
				}, {
					"regex": "(Pale[Mm]oon)/(\\d+)\\.(\\d+)\\.?(\\d+)?",
					"family_replacement": "Pale Moon (Firefox Variant)"
				}, {
					"regex": "(Fennec)/(\\d+)\\.(\\d+)\\.?([ab]?\\d+[a-z]*)",
					"family_replacement": "Firefox Mobile"
				}, {
					"regex": "(Fennec)/(\\d+)\\.(\\d+)(pre)",
					"family_replacment": "Firefox Mobile"
				}, {
					"regex": "(Fennec)/(\\d+)\\.(\\d+)",
					"family_replacement": "Firefox Mobile"
				}, {
					"regex": "Mobile.*(Firefox)/(\\d+)\\.(\\d+)",
					"family_replacement": "Firefox Mobile"
				}, {
					"regex": "(Namoroka|Shiretoko|Minefield)/(\\d+)\\.(\\d+)\\.(\\d+(?:pre)?)",
					"family_replacement": "Firefox ($1)"
				}, {
					"regex": "(Firefox)/(\\d+)\\.(\\d+)(a\\d+[a-z]*)",
					"family_replacement": "Firefox Alpha"
				}, {
					"regex": "(Firefox)/(\\d+)\\.(\\d+)(b\\d+[a-z]*)",
					"family_replacement": "Firefox Beta"
				}, {
					"regex": "(Firefox)-(?:\\d+\\.\\d+)?/(\\d+)\\.(\\d+)(a\\d+[a-z]*)",
					"family_replacement": "Firefox Alpha"
				}, {
					"regex": "(Firefox)-(?:\\d+\\.\\d+)?/(\\d+)\\.(\\d+)(b\\d+[a-z]*)",
					"family_replacement": "Firefox Beta"
				}, {
					"regex": "(Namoroka|Shiretoko|Minefield)/(\\d+)\\.(\\d+)([ab]\\d+[a-z]*)?",
					"family_replacement": "Firefox ($1)"
				}, {
					"regex": "(Firefox).*Tablet browser (\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "MicroB"
				}, {
					"regex": "(MozillaDeveloperPreview)/(\\d+)\\.(\\d+)([ab]\\d+[a-z]*)?"
				}, {
					"regex": "(Flock)/(\\d+)\\.(\\d+)(b\\d+?)"
				}, {
					"regex": "(RockMelt)/(\\d+)\\.(\\d+)\\.(\\d+)"
				}, {
					"regex": "(Navigator)/(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Netscape"
				}, {
					"regex": "(Navigator)/(\\d+)\\.(\\d+)([ab]\\d+)",
					"family_replacement": "Netscape"
				}, {
					"regex": "(Netscape6)/(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Netscape"
				}, {
					"regex": "(MyIBrow)/(\\d+)\\.(\\d+)",
					"family_replacement": "My Internet Browser"
				}, {
					"regex": "(Opera Tablet).*Version/(\\d+)\\.(\\d+)(?:\\.(\\d+))?"
				}, {
					"regex": "(Opera)/.+Opera Mobi.+Version/(\\d+)\\.(\\d+)",
					"family_replacement": "Opera Mobile"
				}, {
					"regex": "Opera Mobi",
					"family_replacement": "Opera Mobile"
				}, {
					"regex": "(Opera Mini)/(\\d+)\\.(\\d+)"
				}, {
					"regex": "(Opera Mini)/att/(\\d+)\\.(\\d+)"
				}, {
					"regex": "(Opera)/9.80.*Version/(\\d+)\\.(\\d+)(?:\\.(\\d+))?"
				}, {
					"regex": "(webOSBrowser)/(\\d+)\\.(\\d+)"
				}, {
					"regex": "(webOS)/(\\d+)\\.(\\d+)",
					"family_replacement": "webOSBrowser"
				}, {
					"regex": "(wOSBrowser).+TouchPad/(\\d+)\\.(\\d+)",
					"family_replacement": "webOS TouchPad"
				}, {
					"regex": "(luakit)",
					"family_replacement": "LuaKit"
				}, {
					"regex": "(Lightning)/(\\d+)\\.(\\d+)([ab]?\\d+[a-z]*)"
				}, {
					"regex": "(Firefox)/(\\d+)\\.(\\d+)\\.(\\d+(?:pre)?) \\(Swiftfox\\)",
					"family_replacement": "Swiftfox"
				}, {
					"regex": "(Firefox)/(\\d+)\\.(\\d+)([ab]\\d+[a-z]*)? \\(Swiftfox\\)",
					"family_replacement": "Swiftfox"
				}, {
					"regex": "rekonq",
					"family_replacement": "Rekonq"
				}, {
					"regex": "(conkeror|Conkeror)/(\\d+)\\.(\\d+)\\.?(\\d+)?",
					"family_replacement": "Conkeror"
				}, {
					"regex": "(konqueror)/(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Konqueror"
				}, {
					"regex": "(WeTab)-Browser"
				}, {
					"regex": "(Comodo_Dragon)/(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Comodo Dragon"
				}, {
					"regex": "(YottaaMonitor)"
				}, {
					"regex": "(Kindle)/(\\d+)\\.(\\d+)"
				}, {
					"regex": "(Symphony) (\\d+).(\\d+)"
				}, {
					"regex": "Minimo"
				}, {
					"regex": "(CrMo)/(\\d+)\\.(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Chrome Mobile"
				}, {
					"regex": "(CriOS)/(\\d+)\\.(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Chrome Mobile iOS"
				}, {
					"regex": "(Chrome)/(\\d+)\\.(\\d+)\\.(\\d+)\\.(\\d+) Mobile",
					"family_replacement": "Chrome Mobile"
				}, {
					"regex": "(chromeframe)/(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Chrome Frame"
				}, {
					"regex": "(UC Browser)(\\d+)\\.(\\d+)\\.(\\d+)"
				}, {
					"regex": "(SLP Browser)/(\\d+)\\.(\\d+)",
					"family_replacement": "Tizen Browser"
				}, {
					"regex": "(Epiphany)/(\\d+)\\.(\\d+).(\\d+)"
				}, {
					"regex": "(SE 2\\.X) MetaSr (\\d+)\\.(\\d+)",
					"family_replacement": "Sogou Explorer"
				}, {
					"regex": "(Pingdom.com_bot_version_)(\\d+)\\.(\\d+)",
					"family_replacement": "PingdomBot"
				}, {
					"regex": "(facebookexternalhit)/(\\d+)\\.(\\d+)",
					"family_replacement": "FacebookBot"
				}, {
					"regex": "(Twitterbot)/(\\d+)\\.(\\d+)",
					"family_replacement": "TwitterBot"
				}, {
					"regex": "(AdobeAIR|Chromium|FireWeb|Jasmine|ANTGalio|Midori|Fresco|Lobo|PaleMoon|Maxthon|Lynx|OmniWeb|Dillo|Camino|Demeter|Fluid|Fennec|Shiira|Sunrise|Chrome|Flock|Netscape|Lunascape|WebPilot|NetFront|Netfront|Konqueror|SeaMonkey|Kazehakase|Vienna|Iceape|Iceweasel|IceWeasel|Iron|K-Meleon|Sleipnir|Galeon|GranParadiso|Opera Mini|iCab|NetNewsWire|ThunderBrowse|Iron|Iris|UP\\.Browser|Bunjaloo|Google Earth|Raven for Mac)/(\\d+)\\.(\\d+)\\.(\\d+)"
				}, {
					"regex": "(Bolt|Jasmine|IceCat|Skyfire|Midori|Maxthon|Lynx|Arora|IBrowse|Dillo|Camino|Shiira|Fennec|Phoenix|Chrome|Flock|Netscape|Lunascape|Epiphany|WebPilot|Opera Mini|Opera|NetFront|Netfront|Konqueror|Googlebot|SeaMonkey|Kazehakase|Vienna|Iceape|Iceweasel|IceWeasel|Iron|K-Meleon|Sleipnir|Galeon|GranParadiso|iCab|NetNewsWire|Iron|Space Bison|Stainless|Orca|Dolfin|BOLT|Minimo|Tizen Browser|Polaris)/(\\d+)\\.(\\d+)"
				}, {
					"regex": "(iRider|Crazy Browser|SkipStone|iCab|Lunascape|Sleipnir|Maemo Browser) (\\d+)\\.(\\d+)\\.(\\d+)"
				}, {
					"regex": "(iCab|Lunascape|Opera|Android|Jasmine|Polaris|BREW) (\\d+)\\.(\\d+)\\.?(\\d+)?"
				}, {
					"regex": "(Android) Donut",
					"v2_replacement": "2",
					"v1_replacement": "1"
				}, {
					"regex": "(Android) Eclair",
					"v2_replacement": "1",
					"v1_replacement": "2"
				}, {
					"regex": "(Android) Froyo",
					"v2_replacement": "2",
					"v1_replacement": "2"
				}, {
					"regex": "(Android) Gingerbread",
					"v2_replacement": "3",
					"v1_replacement": "2"
				}, {
					"regex": "(Android) Honeycomb",
					"v1_replacement": "3"
				}, {
					"regex": "(IEMobile)[ /](\\d+)\\.(\\d+)",
					"family_replacement": "IE Mobile"
				}, {
					"regex": "(MSIE) (\\d+)\\.(\\d+).*XBLWP7",
					"family_replacement": "IE Large Screen"
				}, {
					"regex": "(Firefox)/(\\d+)\\.(\\d+)\\.(\\d+)"
				}, {
					"regex": "(Firefox)/(\\d+)\\.(\\d+)(pre|[ab]\\d+[a-z]*)?"
				}, {
					"regex": "(Obigo)InternetBrowser"
				}, {
					"regex": "(Obigo)\\-Browser"
				}, {
					"regex": "(Obigo|OBIGO)[^\\d]*(\\d+)(?:.(\\d+))?"
				}, {
					"regex": "(MAXTHON|Maxthon) (\\d+)\\.(\\d+)",
					"family_replacement": "Maxthon"
				}, {
					"regex": "(Maxthon|MyIE2|Uzbl|Shiira)",
					"v1_replacement": "0"
				}, {
					"regex": "(PLAYSTATION) (\\d+)",
					"family_replacement": "PlayStation"
				}, {
					"regex": "(PlayStation Portable)[^\\d]+(\\d+).(\\d+)"
				}, {
					"regex": "(BrowseX) \\((\\d+)\\.(\\d+)\\.(\\d+)"
				}, {
					"regex": "(POLARIS)/(\\d+)\\.(\\d+)",
					"family_replacement": "Polaris"
				}, {
					"regex": "(Embider)/(\\d+)\\.(\\d+)",
					"family_replacement": "Polaris"
				}, {
					"regex": "(BonEcho)/(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Bon Echo"
				}, {
					"regex": "(iPod).+Version/(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Mobile Safari"
				}, {
					"regex": "(iPod).*Version/(\\d+)\\.(\\d+)",
					"family_replacement": "Mobile Safari"
				}, {
					"regex": "(iPod)",
					"family_replacement": "Mobile Safari"
				}, {
					"regex": "(iPhone).*Version/(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Mobile Safari"
				}, {
					"regex": "(iPhone).*Version/(\\d+)\\.(\\d+)",
					"family_replacement": "Mobile Safari"
				}, {
					"regex": "(iPhone)",
					"family_replacement": "Mobile Safari"
				}, {
					"regex": "(iPad).*Version/(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Mobile Safari"
				}, {
					"regex": "(iPad).*Version/(\\d+)\\.(\\d+)",
					"family_replacement": "Mobile Safari"
				}, {
					"regex": "(iPad)",
					"family_replacement": "Mobile Safari"
				}, {
					"regex": "(AvantGo) (\\d+).(\\d+)"
				}, {
					"regex": "(Avant)",
					"v1_replacement": "1"
				}, {
					"regex": "^(Nokia)",
					"family_replacement": "Nokia Services (WAP) Browser"
				}, {
					"regex": "(NokiaBrowser)/(\\d+)\\.(\\d+).(\\d+)\\.(\\d+)"
				}, {
					"regex": "(NokiaBrowser)/(\\d+)\\.(\\d+).(\\d+)"
				}, {
					"regex": "(NokiaBrowser)/(\\d+)\\.(\\d+)"
				}, {
					"regex": "(BrowserNG)/(\\d+)\\.(\\d+).(\\d+)",
					"family_replacement": "NokiaBrowser"
				}, {
					"regex": "(Series60)/5\\.0",
					"v2_replacement": "0",
					"v1_replacement": "7",
					"family_replacement": "NokiaBrowser"
				}, {
					"regex": "(Series60)/(\\d+)\\.(\\d+)",
					"family_replacement": "Nokia OSS Browser"
				}, {
					"regex": "(S40OviBrowser)/(\\d+)\\.(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Nokia Series 40 Ovi Browser"
				}, {
					"regex": "(Nokia)[EN]?(\\d+)"
				}, {
					"regex": "(PlayBook).+RIM Tablet OS (\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Blackberry WebKit"
				}, {
					"regex": "(Black[bB]erry).+Version/(\\d+)\\.(\\d+)\\.(\\d+)",
					"family_replacement": "Blackberry WebKit"
				}, {
					"regex": "(Black[bB]erry)\\s?(\\d+)",
					"family_replacement": "Blackberry"
				}, {
					"regex": "(OmniWeb)/v(\\d+)\\.(\\d+)"
				}, {
					"regex": "(Blazer)/(\\d+)\\.(\\d+)",
					"family_replacement": "Palm Blazer"
				}, {
					"regex": "(Pre)/(\\d+)\\.(\\d+)",
					"family_replacement": "Palm Pre"
				}, {
					"regex": "(Links) \\((\\d+)\\.(\\d+)"
				}, {
					"regex": "(QtWeb) Internet Browser/(\\d+)\\.(\\d+)"
				}, {
					"regex": "(Silk)/(\\d+)\\.(\\d+)(?:\\.([0-9\\-]+))?"
				}, {
					"regex": "(AppleWebKit)/(\\d+)\\.?(\\d+)?\\+ .* Version/\\d+\\.\\d+.\\d+ Safari/",
					"family_replacement": "WebKit Nightly"
				}, {
					"regex": "(Version)/(\\d+)\\.(\\d+)(?:\\.(\\d+))?.*Safari/",
					"family_replacement": "Safari"
				}, {
					"regex": "(Safari)/\\d+"
				}, {
					"regex": "(OLPC)/Update(\\d+)\\.(\\d+)"
				}, {
					"regex": "(OLPC)/Update()\\.(\\d+)",
					"v1_replacement": "0"
				}, {
					"regex": "(SEMC\\-Browser)/(\\d+)\\.(\\d+)"
				}, {
					"regex": "(Teleca)",
					"family_replacement": "Teleca Browser"
				}, {
					"regex": "(MSIE) (\\d+)\\.(\\d+)",
					"family_replacement": "IE"
				}],
				"os_parsers": [{
					"regex": "(Android) (\\d+)\\.(\\d+)(?:[.\\-]([a-z0-9]+))?"
				}, {
					"regex": "(Android)\\-(\\d+)\\.(\\d+)(?:[.\\-]([a-z0-9]+))?"
				}, {
					"regex": "(Android) Donut",
					"os_v2_replacement": "2",
					"os_v1_replacement": "1"
				}, {
					"regex": "(Android) Eclair",
					"os_v2_replacement": "1",
					"os_v1_replacement": "2"
				}, {
					"regex": "(Android) Froyo",
					"os_v2_replacement": "2",
					"os_v1_replacement": "2"
				}, {
					"regex": "(Android) Gingerbread",
					"os_v2_replacement": "3",
					"os_v1_replacement": "2"
				}, {
					"regex": "(Android) Honeycomb",
					"os_v1_replacement": "3"
				}, {
					"regex": "(Windows Phone 6\\.5)"
				}, {
					"regex": "(Windows (?:NT 5\\.2|NT 5\\.1))",
					"os_replacement": "Windows XP"
				}, {
					"regex": "(XBLWP7)",
					"os_replacement": "Windows Phone OS"
				}, {
					"regex": "(Windows NT 6\\.1)",
					"os_replacement": "Windows 7"
				}, {
					"regex": "(Windows NT 6\\.0)",
					"os_replacement": "Windows Vista"
				}, {
					"regex": "(Windows 98|Windows XP|Windows ME|Windows 95|Windows CE|Windows 7|Windows NT 4\\.0|Windows Vista|Windows 2000)"
				}, {
					"regex": "(Windows NT 6\\.2)",
					"os_replacement": "Windows 8"
				}, {
					"regex": "(Windows NT 5\\.0)",
					"os_replacement": "Windows 2000"
				}, {
					"regex": "(Windows Phone OS) (\\d+)\\.(\\d+)"
				}, {
					"regex": "(Windows ?Mobile)",
					"os_replacement": "Windows Mobile"
				}, {
					"regex": "(WinNT4.0)",
					"os_replacement": "Windows NT 4.0"
				}, {
					"regex": "(Win98)",
					"os_replacement": "Windows 98"
				}, {
					"regex": "(Tizen)/(\\d+)\\.(\\d+)"
				}, {
					"regex": "(Mac OS X) (\\d+)[_.](\\d+)(?:[_.](\\d+))?"
				}, {
					"regex": "(?:PPC|Intel) (Mac OS X)"
				}, {
					"regex": "(CPU OS|iPhone OS) (\\d+)_(\\d+)(?:_(\\d+))?",
					"os_replacement": "iOS"
				}, {
					"regex": "(iPhone|iPad|iPod); Opera",
					"os_replacement": "iOS"
				}, {
					"regex": "(iPhone|iPad|iPod).*Mac OS X.*Version/(\\d+)\\.(\\d+)",
					"os_replacement": "iOS"
				}, {
					"regex": "(CrOS) [a-z0-9_]+ (\\d+)\\.(\\d+)(?:\\.(\\d+))?",
					"os_replacement": "Chrome OS"
				}, {
					"regex": "(Debian)-(\\d+)\\.(\\d+)\\.(\\d+)(?:\\.(\\d+))?"
				}, {
					"regex": "(Linux Mint)(?:/(\\d+))?"
				}, {
					"regex": "(Mandriva)(?: Linux)?/(\\d+)\\.(\\d+)\\.(\\d+)(?:\\.(\\d+))?"
				}, {
					"regex": "(Symbian[Oo][Ss])/(\\d+)\\.(\\d+)",
					"os_replacement": "Symbian OS"
				}, {
					"regex": "(Symbian/3).+NokiaBrowser/7\\.3",
					"os_replacement": "Symbian^3 Anna"
				}, {
					"regex": "(Symbian/3).+NokiaBrowser/7\\.4",
					"os_replacement": "Symbian^3 Belle"
				}, {
					"regex": "(Symbian/3)",
					"os_replacement": "Symbian^3"
				}, {
					"regex": "(Series 60|SymbOS|S60)",
					"os_replacement": "Symbian OS"
				}, {
					"regex": "(MeeGo)"
				}, {
					"regex": "Symbian [Oo][Ss]",
					"os_replacement": "Symbian OS"
				}, {
					"regex": "(Black[Bb]erry)[0-9a-z]+/(\\d+)\\.(\\d+)\\.(\\d+)(?:\\.(\\d+))?",
					"os_replacement": "BlackBerry OS"
				}, {
					"regex": "(Black[Bb]erry).+Version/(\\d+)\\.(\\d+)\\.(\\d+)(?:\\.(\\d+))?",
					"os_replacement": "BlackBerry OS"
				}, {
					"regex": "(RIM Tablet OS) (\\d+)\\.(\\d+)\\.(\\d+)",
					"os_replacement": "BlackBerry Tablet OS"
				}, {
					"regex": "(Play[Bb]ook)",
					"os_replacement": "BlackBerry Tablet OS"
				}, {
					"regex": "(Black[Bb]erry)",
					"os_replacement": "Blackberry OS"
				}, {
					"regex": "(webOS|hpwOS)/(\\d+)\\.(\\d+)(?:\\.(\\d+))?",
					"os_replacement": "webOS"
				}, {
					"regex": "(SUSE|Fedora|Red Hat|PCLinuxOS)/(\\d+)\\.(\\d+)\\.(\\d+)\\.(\\d+)"
				}, {
					"regex": "(SUSE|Fedora|Red Hat|Puppy|PCLinuxOS|CentOS)/(\\d+)\\.(\\d+)\\.(\\d+)"
				}, {
					"regex": "(Ubuntu|Kindle|Bada|Lubuntu|BackTrack|Red Hat|Slackware)/(\\d+)\\.(\\d+)"
				}, {
					"regex": "(Windows|OpenBSD|FreeBSD|NetBSD|Ubuntu|Kubuntu|Android|Arch Linux|CentOS|WeTab|Slackware)"
				}, {
					"regex": "(Linux|BSD)"
				}],
				"mobile_os_families": [
					"Windows Phone 6.5",
					"Windows CE",
					"Symbian OS"
				],
				"device_parsers": [{
					"regex": "HTC ([A-Z][a-z0-9]+) Build",
					"device_replacement": "HTC $1"
				}, {
					"regex": "HTC ([A-Z][a-z0-9 ]+) \\d+\\.\\d+\\.\\d+\\.\\d+",
					"device_replacement": "HTC $1"
				}, {
					"regex": "HTC_Touch_([A-Za-z0-9]+)",
					"device_replacement": "HTC Touch ($1)"
				}, {
					"regex": "USCCHTC(\\d+)",
					"device_replacement": "HTC $1 (US Cellular)"
				}, {
					"regex": "Sprint APA(9292)",
					"device_replacement": "HTC $1 (Sprint)"
				}, {
					"regex": "HTC ([A-Za-z0-9]+ [A-Z])",
					"device_replacement": "HTC $1"
				}, {
					"regex": "HTC-([A-Za-z0-9]+)",
					"device_replacement": "HTC $1"
				}, {
					"regex": "HTC_([A-Za-z0-9]+)",
					"device_replacement": "HTC $1"
				}, {
					"regex": "HTC ([A-Za-z0-9]+)",
					"device_replacement": "HTC $1"
				}, {
					"regex": "(ADR[A-Za-z0-9]+)",
					"device_replacement": "HTC $1"
				}, {
					"regex": "(HTC)"
				}, {
					"regex": "SonyEricsson([A-Za-z0-9]+)/",
					"device_replacement": "Ericsson $1"
				}, {
					"regex": "Android[\\- ][\\d]+\\.[\\d]+\\; [A-Za-z]{2}\\-[A-Za-z]{2}\\; WOWMobile (.+) Build"
				}, {
					"regex": "Android[\\- ][\\d]+\\.[\\d]+\\.[\\d]+; [A-Za-z]{2}\\-[A-Za-z]{2}\\; (.+) Build"
				}, {
					"regex": "Android[\\- ][\\d]+\\.[\\d]+\\-update1\\; [A-Za-z]{2}\\-[A-Za-z]{2}\\; (.+) Build"
				}, {
					"regex": "Android[\\- ][\\d]+\\.[\\d]+\\; [A-Za-z]{2}\\-[A-Za-z]{2}\\; (.+) Build"
				}, {
					"regex": "Android[\\- ][\\d]+\\.[\\d]+\\.[\\d]+; (.+) Build"
				}, {
					"regex": "NokiaN([0-9]+)",
					"device_replacement": "Nokia N$1"
				}, {
					"regex": "Nokia([A-Za-z0-9\\v-]+)",
					"device_replacement": "Nokia $1"
				}, {
					"regex": "NOKIA ([A-Za-z0-9\\-]+)",
					"device_replacement": "Nokia $1"
				}, {
					"regex": "Nokia ([A-Za-z0-9\\-]+)",
					"device_replacement": "Nokia $1"
				}, {
					"regex": "Lumia ([A-Za-z0-9\\-]+)",
					"device_replacement": "Lumia $1"
				}, {
					"regex": "Symbian",
					"device_replacement": "Nokia"
				}, {
					"regex": "(PlayBook).+RIM Tablet OS",
					"device_replacement": "Blackberry Playbook"
				}, {
					"regex": "(Black[Bb]erry [0-9]+);"
				}, {
					"regex": "Black[Bb]erry([0-9]+)",
					"device_replacement": "BlackBerry $1"
				}, {
					"regex": "(Pre)/(\\d+)\\.(\\d+)",
					"device_replacement": "Palm Pre"
				}, {
					"regex": "(Pixi)/(\\d+)\\.(\\d+)",
					"device_replacement": "Palm Pixi"
				}, {
					"regex": "(Touchpad)/(\\d+)\\.(\\d+)",
					"device_replacement": "HP Touchpad"
				}, {
					"regex": "HPiPAQ([A-Za-z0-9]+)/(\\d+).(\\d+)",
					"device_replacement": "HP iPAQ $1"
				}, {
					"regex": "Palm([A-Za-z0-9]+)",
					"device_replacement": "Palm $1"
				}, {
					"regex": "Treo([A-Za-z0-9]+)",
					"device_replacement": "Palm Treo $1"
				}, {
					"regex": "webOS.*(P160UNA)/(\\d+).(\\d+)",
					"device_replacement": "HP Veer"
				}, {
					"regex": "(Kindle Fire)"
				}, {
					"regex": "(Kindle)"
				}, {
					"regex": "(Silk)/(\\d+)\\.(\\d+)(?:\\.([0-9\\-]+))?",
					"device_replacement": "Kindle Fire"
				}, {
					"regex": "(iPad) Simulator;"
				}, {
					"regex": "(iPad);"
				}, {
					"regex": "(iPod);"
				}, {
					"regex": "(iPhone) Simulator;"
				}, {
					"regex": "(iPhone);"
				}, {
					"regex": "Nexus\\ ([A-Za-z0-9\\-]+)",
					"device_replacement": "Nexus $1"
				}, {
					"regex": "acer_([A-Za-z0-9]+)_",
					"device_replacement": "Acer $1"
				}, {
					"regex": "acer_([A-Za-z0-9]+)_",
					"device_replacement": "Acer $1"
				}, {
					"regex": "Amoi\\-([A-Za-z0-9]+)",
					"device_replacement": "Amoi $1"
				}, {
					"regex": "AMOI\\-([A-Za-z0-9]+)",
					"device_replacement": "Amoi $1"
				}, {
					"regex": "Asus\\-([A-Za-z0-9]+)",
					"device_replacement": "Asus $1"
				}, {
					"regex": "ASUS\\-([A-Za-z0-9]+)",
					"device_replacement": "Asus $1"
				}, {
					"regex": "BIRD\\-([A-Za-z0-9]+)",
					"device_replacement": "Bird $1"
				}, {
					"regex": "BIRD\\.([A-Za-z0-9]+)",
					"device_replacement": "Bird $1"
				}, {
					"regex": "BIRD ([A-Za-z0-9]+)",
					"device_replacement": "Bird $1"
				}, {
					"regex": "Dell ([A-Za-z0-9]+)",
					"device_replacement": "Dell $1"
				}, {
					"regex": "DoCoMo/2\\.0 ([A-Za-z0-9]+)",
					"device_replacement": "DoCoMo $1"
				}, {
					"regex": "([A-Za-z0-9]+)\\_W\\;FOMA",
					"device_replacement": "DoCoMo $1"
				}, {
					"regex": "([A-Za-z0-9]+)\\;FOMA",
					"device_replacement": "DoCoMo $1"
				}, {
					"regex": "vodafone([A-Za-z0-9]+)",
					"device_replacement": "Huawei Vodafone $1"
				}, {
					"regex": "i\\-mate ([A-Za-z0-9]+)",
					"device_replacement": "i-mate $1"
				}, {
					"regex": "Kyocera\\-([A-Za-z0-9]+)",
					"device_replacement": "Kyocera $1"
				}, {
					"regex": "KWC\\-([A-Za-z0-9]+)",
					"device_replacement": "Kyocera $1"
				}, {
					"regex": "Lenovo\\-([A-Za-z0-9]+)",
					"device_replacement": "Lenovo $1"
				}, {
					"regex": "Lenovo\\_([A-Za-z0-9]+)",
					"device_replacement": "Lenovo $1"
				}, {
					"regex": "LG/([A-Za-z0-9]+)",
					"device_replacement": "LG $1"
				}, {
					"regex": "LG-LG([A-Za-z0-9]+)",
					"device_replacement": "LG $1"
				}, {
					"regex": "LGE-LG([A-Za-z0-9]+)",
					"device_replacement": "LG $1"
				}, {
					"regex": "LGE VX([A-Za-z0-9]+)",
					"device_replacement": "LG $1"
				}, {
					"regex": "LG ([A-Za-z0-9]+)",
					"device_replacement": "LG $1"
				}, {
					"regex": "LGE LG\\-AX([A-Za-z0-9]+)",
					"device_replacement": "LG $1"
				}, {
					"regex": "LG\\-([A-Za-z0-9]+)",
					"device_replacement": "LG $1"
				}, {
					"regex": "LGE\\-([A-Za-z0-9]+)",
					"device_replacement": "LG $1"
				}, {
					"regex": "LG([A-Za-z0-9]+)",
					"device_replacement": "LG $1"
				}, {
					"regex": "(KIN)\\.One (\\d+)\\.(\\d+)",
					"device_replacement": "Microsoft $1"
				}, {
					"regex": "(KIN)\\.Two (\\d+)\\.(\\d+)",
					"device_replacement": "Microsoft $1"
				}, {
					"regex": "(Motorola)\\-([A-Za-z0-9]+)"
				}, {
					"regex": "MOTO\\-([A-Za-z0-9]+)",
					"device_replacement": "Motorola $1"
				}, {
					"regex": "MOT\\-([A-Za-z0-9]+)",
					"device_replacement": "Motorola $1"
				}, {
					"regex": "Philips([A-Za-z0-9]+)",
					"device_replacement": "Philips $1"
				}, {
					"regex": "Philips ([A-Za-z0-9]+)",
					"device_replacement": "Philips $1"
				}, {
					"regex": "SAMSUNG-([A-Za-z0-9\\-]+)",
					"device_replacement": "Samsung $1"
				}, {
					"regex": "SAMSUNG\\; ([A-Za-z0-9\\-]+)",
					"device_replacement": "Samsung $1"
				}, {
					"regex": "Softbank/1\\.0/([A-Za-z0-9]+)",
					"device_replacement": "Softbank $1"
				}, {
					"regex": "Softbank/2\\.0/([A-Za-z0-9]+)",
					"device_replacement": "Softbank $1"
				}, {
					"regex": "(hiptop|avantgo|plucker|xiino|blazer|elaine|up.browser|up.link|mmp|smartphone|midp|wap|vodafone|o2|pocket|mobile|pda)",
					"device_replacement": "Generic Smartphone"
				}, {
					"regex": "^(1207|3gso|4thp|501i|502i|503i|504i|505i|506i|6310|6590|770s|802s|a wa|acer|acs\\-|airn|alav|asus|attw|au\\-m|aur |aus |abac|acoo|aiko|alco|alca|amoi|anex|anny|anyw|aptu|arch|argo|bell|bird|bw\\-n|bw\\-u|beck|benq|bilb|blac|c55/|cdm\\-|chtm|capi|comp|cond|craw|dall|dbte|dc\\-s|dica|ds\\-d|ds12|dait|devi|dmob|doco|dopo|el49|erk0|esl8|ez40|ez60|ez70|ezos|ezze|elai|emul|eric|ezwa|fake|fly\\-|fly\\_|g\\-mo|g1 u|g560|gf\\-5|grun|gene|go.w|good|grad|hcit|hd\\-m|hd\\-p|hd\\-t|hei\\-|hp i|hpip|hs\\-c|htc |htc\\-|htca|htcg)",
					"device_replacement": "Generic Feature Phone"
				}, {
					"regex": "^(htcp|htcs|htct|htc\\_|haie|hita|huaw|hutc|i\\-20|i\\-go|i\\-ma|i230|iac|iac\\-|iac/|ig01|im1k|inno|iris|jata|java|kddi|kgt|kgt/|kpt |kwc\\-|klon|lexi|lg g|lg\\-a|lg\\-b|lg\\-c|lg\\-d|lg\\-f|lg\\-g|lg\\-k|lg\\-l|lg\\-m|lg\\-o|lg\\-p|lg\\-s|lg\\-t|lg\\-u|lg\\-w|lg/k|lg/l|lg/u|lg50|lg54|lge\\-|lge/|lynx|leno|m1\\-w|m3ga|m50/|maui|mc01|mc21|mcca|medi|meri|mio8|mioa|mo01|mo02|mode|modo|mot |mot\\-|mt50|mtp1|mtv |mate|maxo|merc|mits|mobi|motv|mozz|n100|n101|n102|n202|n203|n300|n302|n500|n502|n505|n700|n701|n710|nec\\-|nem\\-|newg|neon)",
					"device_replacement": "Generic Feature Phone"
				}, {
					"regex": "^(netf|noki|nzph|o2 x|o2\\-x|opwv|owg1|opti|oran|ot\\-s|p800|pand|pg\\-1|pg\\-2|pg\\-3|pg\\-6|pg\\-8|pg\\-c|pg13|phil|pn\\-2|pt\\-g|palm|pana|pire|pock|pose|psio|qa\\-a|qc\\-2|qc\\-3|qc\\-5|qc\\-7|qc07|qc12|qc21|qc32|qc60|qci\\-|qwap|qtek|r380|r600|raks|rim9|rove|s55/|sage|sams|sc01|sch\\-|scp\\-|sdk/|se47|sec\\-|sec0|sec1|semc|sgh\\-|shar|sie\\-|sk\\-0|sl45|slid|smb3|smt5|sp01|sph\\-|spv |spv\\-|sy01|samm|sany|sava|scoo|send|siem|smar|smit|soft|sony|t\\-mo|t218|t250|t600|t610|t618|tcl\\-|tdg\\-|telm|tim\\-|ts70|tsm\\-|tsm3|tsm5|tx\\-9|tagt)",
					"device_replacement": "Generic Feature Phone"
				}, {
					"regex": "^(talk|teli|topl|tosh|up.b|upg1|utst|v400|v750|veri|vk\\-v|vk40|vk50|vk52|vk53|vm40|vx98|virg|vite|voda|vulc|w3c |w3c\\-|wapj|wapp|wapu|wapm|wig |wapi|wapr|wapv|wapy|wapa|waps|wapt|winc|winw|wonu|x700|xda2|xdag|yas\\-|your|zte\\-|zeto|aste|audi|avan|blaz|brew|brvw|bumb|ccwa|cell|cldc|cmd\\-|dang|eml2|fetc|hipt|http|ibro|idea|ikom|ipaq|jbro|jemu|jigs|keji|kyoc|kyok|libw|m\\-cr|midp|mmef|moto|mwbp|mywa|newt|nok6|o2im|pant|pdxg|play|pluc|port|prox|rozo|sama|seri|smal|symb|treo|upsi|vx52|vx53|vx60|vx61|vx70|vx80|vx81|vx83|vx85|wap\\-|webc|whit|wmlb|xda\\-|xda\\_)",
					"device_replacement": "Generic Feature Phone"
				}, {
					"regex": "(bot|borg|google(^tv)|yahoo|slurp|msnbot|msrbot|openbot|archiver|netresearch|lycos|scooter|altavista|teoma|gigabot|baiduspider|blitzbot|oegp|charlotte|furlbot|http%20client|polybot|htdig|ichiro|mogimogi|larbin|pompos|scrubby|searchsight|seekbot|semanticdiscovery|silk|snappy|speedy|spider|voila|vortex|voyager|zao|zeal|fast\\-webcrawler|converacrawler|dataparksearch|findlinks)",
					"device_replacement": "Spider"
				}],
				"mobile_user_agent_families": [
					"Firefox Mobile",
					"Opera Mobile",
					"Opera Mini",
					"Mobile Safari",
					"webOS",
					"IE Mobile",
					"Playstation Portable",
					"Nokia",
					"Blackberry",
					"Palm",
					"Silk",
					"Android",
					"Maemo",
					"Obigo",
					"Netfront",
					"AvantGo",
					"Teleca",
					"SEMC-Browser",
					"Bolt",
					"Iris",
					"UP.Browser",
					"Symphony",
					"Minimo",
					"Bunjaloo",
					"Jasmine",
					"Dolfin",
					"Polaris",
					"BREW",
					"Chrome Mobile",
					"UC Browser",
					"Tizen Browser"
				]
			};

			// Context
			var _this = function() {};

			// Mobile Check
			var mobile_agents = {};
			var mobile_user_agent_families = regexes.mobile_user_agent_families.map(function(str) {
				mobile_agents[str] = true;
			});
			var mobile_os_families = regexes.mobile_os_families.map(function(str) {
				mobile_agents[str] = true;
			});

			// User-Agent Parsed
			var ua_parsers = regexes.user_agent_parsers.map(function(obj) {
				var regexp = new RegExp(obj.regex),
					famRep = obj.family_replacement,
					majorVersionRep = obj.major_version_replacement;

				function parser(ua) {
					var m = ua.match(regexp);
					if(!m)
						return null;
					var family = famRep ? famRep.replace('$1', m[1]) : m[1];
					var obj = new UserAgent(family);
					obj.browser.major = parseInt(majorVersionRep ? majorVersionRep : m[2]);
					obj.browser.minor = m[3] ? parseInt(m[3]) : null;
					obj.browser.patch = m[4] ? parseInt(m[4]) : null;
					obj.isMobile = mobile_agents.hasOwnProperty(family);
					obj.isSpider = (family === 'Spider');

					return obj;
				}
				return parser;
			});

			// Find Utility
			var find = function(ua, obj) {
				for(var i = 0; i < obj.length; i++) {
					var ret = obj[i](ua);
					if(ret) {
						break;
					}
				}
				return ret;
			};

			// Parsers Utility
			var parsers = function(type) {
				return regexes[type + '_parsers'].map(function(obj) {
					var regexp = new RegExp(obj.regex),
						rep = obj[type + '_replacement'];

					function parser(ua) {
						var m = ua.match(regexp);
						if(!m)
							return null;
						var obj = {};
						obj.family = (rep ? rep.replace('$1', m[1]) : m[1]);
						obj.major = m[2] ? parseInt(m[2]) : null;
						obj.minor = m[3] ? parseInt(m[3]) : null;
						obj.patch = m[4] ? parseInt(m[4]) : null;
						return obj;
					}
					return parser;
				});
			};

			// Operating Systems Parsed
			var os_parsers = parsers('os');

			// Devices Parsed
			var device_parsers = parsers('device');

			// User Agent
			function UserAgent(family) {
				this.browser = {};
				this.browser.family = family || 'Other';
			}

			// Check String
			function check(str) {
				return(typeof str != 'undefined' && str != null);
			}

			// Type - To Version String Utility
			UserAgent.prototype.toVersionString = function(type) {
				var output = '';
				type = type || 'browser';
				if(check(this[type])) {
					if(check(this[type].major)) {
						output += this[type].major;
						if(check(this[type].minor)) {
							output += '.' + this[type].minor;
							if(check(this[type].patch)) {
								output += '.' + this[type].patch;
							}
						}
					}
				}
				return output;
			};

			// Type - To String Utility
			UserAgent.prototype.toString = function(type) {
				type = type || 'browser';
				var suffix = this.toVersionString(type);
				if(suffix)
					suffix = ' ' + suffix;
				return(this[type] && check(this[type].family)) ? this[type].family + suffix : '';
			};

			// To JSON Utility
			UserAgent.prototype.toJSON = function(type) {
				type = type || 'browser';
				return this[type] || {};
			};

			// Parse User-Agent String
			_this.parse = function(ua) {
				var agent = find(ua, ua_parsers);
				agent = (!agent) ? new UserAgent() : agent;
				agent.os = find(ua, os_parsers);
				agent.device = find(ua, device_parsers);
				return agent;
			}

			return _this;

		})();

		// Export the Underscore object for **Node.js** and **"CommonJS"**, 
		// backwards-compatibility for the old `require()` API. If we're not 
		// CommonJS, add `_` to the global object via a string identifier 
		// the Closure Compiler "advanced" mode. Registration as an AMD 
		// via define() happens at the end of this file
		if(typeof exports !== 'undefined') {
			if(typeof module !== 'undefined' && module.exports) {
				exports = module.exports = detect;
			}
			exports.detect = detect;
		} else {
			root['detect'] = detect;
		}

		// AMD define happens at the end for compatibility with AMD 
		// that don't enforce next-turn semantics on modules
		if(typeof define === 'function' && define.amd) {
			define(function(require) {
				return detect;
			});
		}
	})(window);

	var deviceInfo = (function() {
		var FromTypeName = function() {
			var sUserAgent = navigator.userAgent.toLowerCase();
			var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
			var bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
			var bIsMidp = sUserAgent.match(/midp/i) == "midp";
			var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
			var bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
			var bIsAndroid = sUserAgent.match(/android/i) == "android";
			var bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
			var bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
			if(bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
				return 1; //移动设备
			} else {
				return 2; //非移动设备
			}
		}
		var getPlatInfo = function() {
			var platform = detect.parse(navigator.userAgent);
			var browserversion = "";
			var osversion = "";
			//浏览器版本
			if(platform.browser.major != null) {
				browserversion = browserversion + platform.browser.major;
			}
			if(platform.browser.minor != null) {
				var com = "";
				if(browserversion != "") {
					com = "."
				}
				browserversion = browserversion + com + platform.browser.minor;
			}
			//系统版本
			if(platform.browser.patch != null) {
				var com = "";
				if(browserversion != "") {
					com = "."
				}
				browserversion = browserversion + com + platform.browser.patch;
			}
			if(platform.os.major != null) {
				osversion = osversion + platform.os.major;
			}
			if(platform.os.minor != null) {
				var com = "";
				if(osversion != "") {
					com = "."
				}
				osversion = osversion + com + platform.os.minor;
			}
			if(platform.os.patch != null) {
				var com = "";
				if(osversion != "") {
					com = "."
				}
				osversion = osversion + com + platform.os.patch;
			}
			return {
				browserversion: browserversion,
				browserfamily: platform.browser.family,
				osversion: osversion,
				osfamily: platform.os.family
			}
		}
		var BrowserCore = function() {
			var u = navigator.userAgent,
				app = navigator.appVersion;
			if(u.indexOf('Trident') > -1) {
				return "trident"; //IE内核
			} else if(u.indexOf('Presto') > -1) {
				return "presto"; //opera内核
			} else if(u.indexOf('AppleWebKit') > -1) {
				return "webKit"; //苹果、谷歌内核
			} else if(u.indexOf('Gecko') > -1) {
				return "gecko"; //火狐内核
			} else if(!!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
				return "ios"; //ios终端
			} else if(u.indexOf('Android') > -1 || u.indexOf('Linux') > -1) {
				return "android"; //android系统
			} else if(u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1) {
				return "iPhone"; //为iPhone或者QQHD浏览器
			} else if(u.indexOf('iPad') > -1) {
				return "iPad"; //是否iPad
			}
		}

		return {
			browserversion: getPlatInfo().browserversion,
			browserfamily: getPlatInfo().browserfamily,
			osversion: getPlatInfo().osversion,
			osfamily: getPlatInfo().osfamily,
			fromtypename: FromTypeName(),
			browsercore: BrowserCore()
		}
	})();

	return deviceInfo;
})();

var GR = (function(window, undefine) {
	var apipath = 'http://222.249.171.157:8081/log/add';

	var scripts = document.getElementsByTagName('script');
	var mesrc = scripts[scripts.length - 1].src;
	var producerid = getUrlVars(mesrc)['pid'];
	var channelid = getUrlVars(mesrc)['cid'];

	if(!localStorage.getItem("usercookieid")) {
		localStorage.setItem("usercookieid", UUID.generate());
	}
	//获取页面来源页
	function getReferrer() {
		var ref = "";
		if(document.referrer.length > 0) {
			ref = document.referrer;
		}
		try {
			if(ref.length == 0 && opener.location.href.length > 0) {
				ref = opener.location.href;
			}
		} catch(e) {}
		return ref;
	}
	//获取url参数
	function getUrlVars(url) {
		var vars = [],
			hash;
		var hashes = url.slice(url.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	}
	//加载搜狐sdk获取ip
	function loadSOHUJscript(callback, options) {
		var oHead = document.getElementsByTagName('HEAD').item(0);
		//通过搜狐接口获取IP和城市名称
		var oScript = document.createElement("script");

		oScript.type = "text/javascript";

		oScript.src = "http://pv.sohu.com/cityjson?ie=utf-8";

		oHead.appendChild(oScript);
		oScript.onload = function() {
			callback(returnCitySN, options);
		}
	}
	//格式化参数
	/*function formatParams(data) {
		var arr = [];
		for(var name in data) {
			arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
		}
		return arr.join("&");
	}*/

	function Ajax(options) {
		var xhr = null;
		var options = options || {};
		options.type = (options.type || "GET").toUpperCase();
		options.dataType = options.dataType || 'json';
		var params = formatParams(options.data);
		if(window.XMLHttpRequest) {
			//IE6以上以及其他浏览器
			xhr = new XMLHttpRequest();
		} else {
			//IE6及其以下版本
			xhr = new ActiveXObject('Microsoft.XMLHTTP');
		}
		if(options.type == 'GET') {
			xhr.open(options.type, apipath + "?" + params, true);
			xhr.send(null);
		} else if(options.type == 'POST') {
			xhr.open(options.type, apipath, true);
			//xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xhr.setRequestHeader("Content-Type", "application/json");
			xhr.send(JSON.stringify(options.data));
		}
		xhr.onreadystatechange = function() {
			if(xhr.readyState == 4) {
				var status = xhr.status;
				if(status == 200) {
					options.success(xhr.responseText)
				} else {
					options.error(xhr)
				}
			}
		}
	}

	function getExtendParams() {
		var kv = [],
			eps = document.getElementsByTagName('extendparam');
		for(var i = 0, len = eps.length; i < len; i++) {
			var ep = eps[i];
			var obj = {};
			obj[ep.attributes.key.value] = ep.attributes.value.value;
			kv.push(obj);
		}
		return kv;
	}
	//参数序列化
	function formatParams(obj) {
		var query = '';
		var name, value, fullSubName, subName, subValue, innerObj, i;

		for(name in obj) {
			value = obj[name];

			if(value instanceof Array) {
				for(i = 0; i < value.length; ++i) {
					subValue = value[i];
					fullSubName = name + '[' + i + ']';
					innerObj = {};
					innerObj[fullSubName] = subValue;
					query += formatParams(innerObj) + '&';
				}
			} else if(value instanceof Object) {
				for(subName in value) {
					subValue = value[subName];
					fullSubName = name + '[' + subName + ']';
					innerObj = {};
					innerObj[fullSubName] = subValue;
					query += formatParams(innerObj) + '&';
				}
			} else if(value !== undefined && value !== null) {
				query += encodeURIComponent(name) + '=' +
					encodeURIComponent(value) + '&';
			}
		}

		return query.length ? query.substr(0, query.length - 1) : query;
	};

	function sendLog(options) {
		var params = {
			RequestVersion: 1000,
			DeviceID: 'cannotgetdeviceid',
			ProducerID: producerid,
			ChannelID: channelid,
			SessionID: localStorage.getItem("usercookieid"), //页面唯一标识
			FromTypeName: Device.fromtypename, //来源类型（1、移动设备 2、非移动设备）  string（字符型）
			SystemName: Device.osfamily, //系统名称  string（字符型）        已发布
			SystemVer: Device.osversion, //系统版本  string（字符型）        已发布
			BrowserName: Device.browserfamily, //浏览器  string（字符型）        已发布
			BrowserVer: Device.browserversion, //浏览器版本  string（字符型）        已发布
			VisitTime: Math.round(new Date().getTime() / 1000), //毫秒时间戳,//Date.parse(new Date()//毫秒变成000显示, //访问时间    
			BrowserCore: Device.browsercore, //浏览器内核  string（字符型）  是      已发布
			ResolutionW: window.screen.width, //分辨率宽度  int（整型）  是      已发布
			ResolutionH: window.screen.height, //分辨率高度  int（整型）  是      已发布
			CurrentPage: window.location.href, //当前页面url
			CustomPara: getExtendParams(),
			Cookie: '',
			FromPage: getReferrer() //页面来源
		}

		Ajax({
			type: 'POST',
			dataType: 'json',
			url: apipath,
			data: params,
			success: function(result) {
			},
			error: function() {}
		})

	}
	//DOM加载完毕
	function domReady(fn) {
		var d = window.document;
		if(d.addEventListener) {
			d.addEventListener('DOMContentLoaded', function() {
				d.removeEventListener('DOMContentLoaded', arguments.callee, false);
				fn();
			}, false)
		} else if(d.attachEvent) {
			//http://javascript.nwbox.com/IEContentLoaded/
			var done = false,
				// only fire once
				init = function() {
					if(!done) {
						done = true;
						fn();
					}
				};
			// polling for no errors
			(function() {
				try {
					// throws errors until after ondocumentready
					d.documentElement.doScroll('left');
				} catch(e) {
					setTimeout(arguments.callee, 50);
					return;
				}
				// no errors, fire
				init();
			})();
			// trying to always fire before onload
			d.onreadystatechange = function() {
				if(d.readyState == 'complete') {
					d.onreadystatechange = null;
					init();
				}
			};
		}
	}
	domReady(sendLog);
})(window);