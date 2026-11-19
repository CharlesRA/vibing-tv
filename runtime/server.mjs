var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dayjs/dayjs.min.js
var require_dayjs_min = __commonJS({
  "node_modules/dayjs/dayjs.min.js"(exports, module) {
    !(function(t, e) {
      "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).dayjs = e();
    })(exports, (function() {
      "use strict";
      var t = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", c = "month", f = "quarter", h = "year", d = "date", l = "Invalid Date", $ = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(t2) {
        var e2 = ["th", "st", "nd", "rd"], n2 = t2 % 100;
        return "[" + t2 + (e2[(n2 - 20) % 10] || e2[n2] || e2[0]) + "]";
      } }, m = function(t2, e2, n2) {
        var r2 = String(t2);
        return !r2 || r2.length >= e2 ? t2 : "" + Array(e2 + 1 - r2.length).join(n2) + t2;
      }, v = { s: m, z: function(t2) {
        var e2 = -t2.utcOffset(), n2 = Math.abs(e2), r2 = Math.floor(n2 / 60), i2 = n2 % 60;
        return (e2 <= 0 ? "+" : "-") + m(r2, 2, "0") + ":" + m(i2, 2, "0");
      }, m: function t2(e2, n2) {
        if (e2.date() < n2.date()) return -t2(n2, e2);
        var r2 = 12 * (n2.year() - e2.year()) + (n2.month() - e2.month()), i2 = e2.clone().add(r2, c), s2 = n2 - i2 < 0, u2 = e2.clone().add(r2 + (s2 ? -1 : 1), c);
        return +(-(r2 + (n2 - i2) / (s2 ? i2 - u2 : u2 - i2)) || 0);
      }, a: function(t2) {
        return t2 < 0 ? Math.ceil(t2) || 0 : Math.floor(t2);
      }, p: function(t2) {
        return { M: c, y: h, w: o, d: a, D: d, h: u, m: s, s: i, ms: r, Q: f }[t2] || String(t2 || "").toLowerCase().replace(/s$/, "");
      }, u: function(t2) {
        return void 0 === t2;
      } }, g = "en", D = {};
      D[g] = M;
      var p = "$isDayjsObject", S = function(t2) {
        return t2 instanceof _ || !(!t2 || !t2[p]);
      }, w = function t2(e2, n2, r2) {
        var i2;
        if (!e2) return g;
        if ("string" == typeof e2) {
          var s2 = e2.toLowerCase();
          D[s2] && (i2 = s2), n2 && (D[s2] = n2, i2 = s2);
          var u2 = e2.split("-");
          if (!i2 && u2.length > 1) return t2(u2[0]);
        } else {
          var a2 = e2.name;
          D[a2] = e2, i2 = a2;
        }
        return !r2 && i2 && (g = i2), i2 || !r2 && g;
      }, O = function(t2, e2) {
        if (S(t2)) return t2.clone();
        var n2 = "object" == typeof e2 ? e2 : {};
        return n2.date = t2, n2.args = arguments, new _(n2);
      }, b = v;
      b.l = w, b.i = S, b.w = function(t2, e2) {
        return O(t2, { locale: e2.$L, utc: e2.$u, x: e2.$x, $offset: e2.$offset });
      };
      var _ = (function() {
        function M2(t2) {
          this.$L = w(t2.locale, null, true), this.parse(t2), this.$x = this.$x || t2.x || {}, this[p] = true;
        }
        var m2 = M2.prototype;
        return m2.parse = function(t2) {
          this.$d = (function(t3) {
            var e2 = t3.date, n2 = t3.utc;
            if (null === e2) return /* @__PURE__ */ new Date(NaN);
            if (b.u(e2)) return /* @__PURE__ */ new Date();
            if (e2 instanceof Date) return new Date(e2);
            if ("string" == typeof e2 && !/Z$/i.test(e2)) {
              var r2 = e2.match($);
              if (r2) {
                var i2 = r2[2] - 1 || 0, s2 = (r2[7] || "0").substring(0, 3);
                return n2 ? new Date(Date.UTC(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2)) : new Date(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2);
              }
            }
            return new Date(e2);
          })(t2), this.init();
        }, m2.init = function() {
          var t2 = this.$d;
          this.$y = t2.getFullYear(), this.$M = t2.getMonth(), this.$D = t2.getDate(), this.$W = t2.getDay(), this.$H = t2.getHours(), this.$m = t2.getMinutes(), this.$s = t2.getSeconds(), this.$ms = t2.getMilliseconds();
        }, m2.$utils = function() {
          return b;
        }, m2.isValid = function() {
          return !(this.$d.toString() === l);
        }, m2.isSame = function(t2, e2) {
          var n2 = O(t2);
          return this.startOf(e2) <= n2 && n2 <= this.endOf(e2);
        }, m2.isAfter = function(t2, e2) {
          return O(t2) < this.startOf(e2);
        }, m2.isBefore = function(t2, e2) {
          return this.endOf(e2) < O(t2);
        }, m2.$g = function(t2, e2, n2) {
          return b.u(t2) ? this[e2] : this.set(n2, t2);
        }, m2.unix = function() {
          return Math.floor(this.valueOf() / 1e3);
        }, m2.valueOf = function() {
          return this.$d.getTime();
        }, m2.startOf = function(t2, e2) {
          var n2 = this, r2 = !!b.u(e2) || e2, f2 = b.p(t2), l2 = function(t3, e3) {
            var i2 = b.w(n2.$u ? Date.UTC(n2.$y, e3, t3) : new Date(n2.$y, e3, t3), n2);
            return r2 ? i2 : i2.endOf(a);
          }, $2 = function(t3, e3) {
            return b.w(n2.toDate()[t3].apply(n2.toDate("s"), (r2 ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(e3)), n2);
          }, y2 = this.$W, M3 = this.$M, m3 = this.$D, v2 = "set" + (this.$u ? "UTC" : "");
          switch (f2) {
            case h:
              return r2 ? l2(1, 0) : l2(31, 11);
            case c:
              return r2 ? l2(1, M3) : l2(0, M3 + 1);
            case o:
              var g2 = this.$locale().weekStart || 0, D2 = (y2 < g2 ? y2 + 7 : y2) - g2;
              return l2(r2 ? m3 - D2 : m3 + (6 - D2), M3);
            case a:
            case d:
              return $2(v2 + "Hours", 0);
            case u:
              return $2(v2 + "Minutes", 1);
            case s:
              return $2(v2 + "Seconds", 2);
            case i:
              return $2(v2 + "Milliseconds", 3);
            default:
              return this.clone();
          }
        }, m2.endOf = function(t2) {
          return this.startOf(t2, false);
        }, m2.$set = function(t2, e2) {
          var n2, o2 = b.p(t2), f2 = "set" + (this.$u ? "UTC" : ""), l2 = (n2 = {}, n2[a] = f2 + "Date", n2[d] = f2 + "Date", n2[c] = f2 + "Month", n2[h] = f2 + "FullYear", n2[u] = f2 + "Hours", n2[s] = f2 + "Minutes", n2[i] = f2 + "Seconds", n2[r] = f2 + "Milliseconds", n2)[o2], $2 = o2 === a ? this.$D + (e2 - this.$W) : e2;
          if (o2 === c || o2 === h) {
            var y2 = this.clone().set(d, 1);
            y2.$d[l2]($2), y2.init(), this.$d = y2.set(d, Math.min(this.$D, y2.daysInMonth())).$d;
          } else l2 && this.$d[l2]($2);
          return this.init(), this;
        }, m2.set = function(t2, e2) {
          return this.clone().$set(t2, e2);
        }, m2.get = function(t2) {
          return this[b.p(t2)]();
        }, m2.add = function(r2, f2) {
          var d2, l2 = this;
          r2 = Number(r2);
          var $2 = b.p(f2), y2 = function(t2) {
            var e2 = O(l2);
            return b.w(e2.date(e2.date() + Math.round(t2 * r2)), l2);
          };
          if ($2 === c) return this.set(c, this.$M + r2);
          if ($2 === h) return this.set(h, this.$y + r2);
          if ($2 === a) return y2(1);
          if ($2 === o) return y2(7);
          var M3 = (d2 = {}, d2[s] = e, d2[u] = n, d2[i] = t, d2)[$2] || 1, m3 = this.$d.getTime() + r2 * M3;
          return b.w(m3, this);
        }, m2.subtract = function(t2, e2) {
          return this.add(-1 * t2, e2);
        }, m2.format = function(t2) {
          var e2 = this, n2 = this.$locale();
          if (!this.isValid()) return n2.invalidDate || l;
          var r2 = t2 || "YYYY-MM-DDTHH:mm:ssZ", i2 = b.z(this), s2 = this.$H, u2 = this.$m, a2 = this.$M, o2 = n2.weekdays, c2 = n2.months, f2 = n2.meridiem, h2 = function(t3, n3, i3, s3) {
            return t3 && (t3[n3] || t3(e2, r2)) || i3[n3].slice(0, s3);
          }, d2 = function(t3) {
            return b.s(s2 % 12 || 12, t3, "0");
          }, $2 = f2 || function(t3, e3, n3) {
            var r3 = t3 < 12 ? "AM" : "PM";
            return n3 ? r3.toLowerCase() : r3;
          };
          return r2.replace(y, (function(t3, r3) {
            return r3 || (function(t4) {
              switch (t4) {
                case "YY":
                  return String(e2.$y).slice(-2);
                case "YYYY":
                  return b.s(e2.$y, 4, "0");
                case "M":
                  return a2 + 1;
                case "MM":
                  return b.s(a2 + 1, 2, "0");
                case "MMM":
                  return h2(n2.monthsShort, a2, c2, 3);
                case "MMMM":
                  return h2(c2, a2);
                case "D":
                  return e2.$D;
                case "DD":
                  return b.s(e2.$D, 2, "0");
                case "d":
                  return String(e2.$W);
                case "dd":
                  return h2(n2.weekdaysMin, e2.$W, o2, 2);
                case "ddd":
                  return h2(n2.weekdaysShort, e2.$W, o2, 3);
                case "dddd":
                  return o2[e2.$W];
                case "H":
                  return String(s2);
                case "HH":
                  return b.s(s2, 2, "0");
                case "h":
                  return d2(1);
                case "hh":
                  return d2(2);
                case "a":
                  return $2(s2, u2, true);
                case "A":
                  return $2(s2, u2, false);
                case "m":
                  return String(u2);
                case "mm":
                  return b.s(u2, 2, "0");
                case "s":
                  return String(e2.$s);
                case "ss":
                  return b.s(e2.$s, 2, "0");
                case "SSS":
                  return b.s(e2.$ms, 3, "0");
                case "Z":
                  return i2;
              }
              return null;
            })(t3) || i2.replace(":", "");
          }));
        }, m2.utcOffset = function() {
          return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
        }, m2.diff = function(r2, d2, l2) {
          var $2, y2 = this, M3 = b.p(d2), m3 = O(r2), v2 = (m3.utcOffset() - this.utcOffset()) * e, g2 = this - m3, D2 = function() {
            return b.m(y2, m3);
          };
          switch (M3) {
            case h:
              $2 = D2() / 12;
              break;
            case c:
              $2 = D2();
              break;
            case f:
              $2 = D2() / 3;
              break;
            case o:
              $2 = (g2 - v2) / 6048e5;
              break;
            case a:
              $2 = (g2 - v2) / 864e5;
              break;
            case u:
              $2 = g2 / n;
              break;
            case s:
              $2 = g2 / e;
              break;
            case i:
              $2 = g2 / t;
              break;
            default:
              $2 = g2;
          }
          return l2 ? $2 : b.a($2);
        }, m2.daysInMonth = function() {
          return this.endOf(c).$D;
        }, m2.$locale = function() {
          return D[this.$L];
        }, m2.locale = function(t2, e2) {
          if (!t2) return this.$L;
          var n2 = this.clone(), r2 = w(t2, e2, true);
          return r2 && (n2.$L = r2), n2;
        }, m2.clone = function() {
          return b.w(this.$d, this);
        }, m2.toDate = function() {
          return new Date(this.valueOf());
        }, m2.toJSON = function() {
          return this.isValid() ? this.toISOString() : null;
        }, m2.toISOString = function() {
          return this.$d.toISOString();
        }, m2.toString = function() {
          return this.$d.toUTCString();
        }, M2;
      })(), Y = _.prototype;
      return O.prototype = Y, [["$ms", r], ["$s", i], ["$m", s], ["$H", u], ["$W", a], ["$M", c], ["$y", h], ["$D", d]].forEach((function(t2) {
        Y[t2[1]] = function(e2) {
          return this.$g(e2, t2[0], t2[1]);
        };
      })), O.extend = function(t2, e2) {
        return t2.$i || (t2(e2, _, O), t2.$i = true), O;
      }, O.locale = w, O.isDayjs = S, O.unix = function(t2) {
        return O(1e3 * t2);
      }, O.en = D[g], O.Ls = D, O.p = {}, O;
    }));
  }
});

// node_modules/dayjs/plugin/duration.js
var require_duration = __commonJS({
  "node_modules/dayjs/plugin/duration.js"(exports, module) {
    !(function(t, s) {
      "object" == typeof exports && "undefined" != typeof module ? module.exports = s() : "function" == typeof define && define.amd ? define(s) : (t = "undefined" != typeof globalThis ? globalThis : t || self).dayjs_plugin_duration = s();
    })(exports, (function() {
      "use strict";
      var t, s, n = 1e3, i = 6e4, e = 36e5, r = 864e5, o = 31536e6, u = 2628e6, d = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/, a = /\[([^\]]+)]|YYYY|YY|Y|M{1,2}|D{1,2}|H{1,2}|m{1,2}|s{1,2}|SSS/g, h = { years: o, months: u, days: r, hours: e, minutes: i, seconds: n, milliseconds: 1, weeks: 6048e5 }, c = function(t2) {
        return t2 instanceof g;
      }, f = function(t2, s2, n2) {
        return new g(t2, n2, s2.$l);
      }, m = function(t2) {
        return s.p(t2) + "s";
      }, l = function(t2) {
        return t2 < 0;
      }, $ = function(t2) {
        return l(t2) ? Math.ceil(t2) : Math.floor(t2);
      }, y = function(t2) {
        return Math.abs(t2);
      }, v = function(t2, s2) {
        return t2 ? l(t2) ? { negative: true, format: "" + y(t2) + s2 } : { negative: false, format: "" + t2 + s2 } : { negative: false, format: "" };
      }, g = (function() {
        function l2(t2, s2, n2) {
          var i2 = this;
          if (this.$d = {}, this.$l = n2, void 0 === t2 && (this.$ms = 0, this.parseFromMilliseconds()), s2) return f(t2 * h[m(s2)], this);
          if ("number" == typeof t2) return this.$ms = t2, this.parseFromMilliseconds(), this;
          if ("object" == typeof t2) return Object.keys(t2).forEach((function(s3) {
            i2.$d[m(s3)] = t2[s3];
          })), this.calMilliseconds(), this;
          if ("string" == typeof t2) {
            var e2 = t2.match(d);
            if (e2) {
              var r2 = e2.slice(2).map((function(t3) {
                return null != t3 ? Number(t3) : 0;
              }));
              return this.$d.years = r2[0], this.$d.months = r2[1], this.$d.weeks = r2[2], this.$d.days = r2[3], this.$d.hours = r2[4], this.$d.minutes = r2[5], this.$d.seconds = r2[6], this.calMilliseconds(), this;
            }
          }
          return this;
        }
        var y2 = l2.prototype;
        return y2.calMilliseconds = function() {
          var t2 = this;
          this.$ms = Object.keys(this.$d).reduce((function(s2, n2) {
            return s2 + (t2.$d[n2] || 0) * h[n2];
          }), 0);
        }, y2.parseFromMilliseconds = function() {
          var t2 = this.$ms;
          this.$d.years = $(t2 / o), t2 %= o, this.$d.months = $(t2 / u), t2 %= u, this.$d.days = $(t2 / r), t2 %= r, this.$d.hours = $(t2 / e), t2 %= e, this.$d.minutes = $(t2 / i), t2 %= i, this.$d.seconds = $(t2 / n), t2 %= n, this.$d.milliseconds = t2;
        }, y2.toISOString = function() {
          var t2 = v(this.$d.years, "Y"), s2 = v(this.$d.months, "M"), n2 = +this.$d.days || 0;
          this.$d.weeks && (n2 += 7 * this.$d.weeks);
          var i2 = v(n2, "D"), e2 = v(this.$d.hours, "H"), r2 = v(this.$d.minutes, "M"), o2 = this.$d.seconds || 0;
          this.$d.milliseconds && (o2 += this.$d.milliseconds / 1e3, o2 = Math.round(1e3 * o2) / 1e3);
          var u2 = v(o2, "S"), d2 = t2.negative || s2.negative || i2.negative || e2.negative || r2.negative || u2.negative, a2 = e2.format || r2.format || u2.format ? "T" : "", h2 = (d2 ? "-" : "") + "P" + t2.format + s2.format + i2.format + a2 + e2.format + r2.format + u2.format;
          return "P" === h2 || "-P" === h2 ? "P0D" : h2;
        }, y2.toJSON = function() {
          return this.toISOString();
        }, y2.format = function(t2) {
          var n2 = t2 || "YYYY-MM-DDTHH:mm:ss", i2 = { Y: this.$d.years, YY: s.s(this.$d.years, 2, "0"), YYYY: s.s(this.$d.years, 4, "0"), M: this.$d.months, MM: s.s(this.$d.months, 2, "0"), D: this.$d.days, DD: s.s(this.$d.days, 2, "0"), H: this.$d.hours, HH: s.s(this.$d.hours, 2, "0"), m: this.$d.minutes, mm: s.s(this.$d.minutes, 2, "0"), s: this.$d.seconds, ss: s.s(this.$d.seconds, 2, "0"), SSS: s.s(this.$d.milliseconds, 3, "0") };
          return n2.replace(a, (function(t3, s2) {
            return s2 || String(i2[t3]);
          }));
        }, y2.as = function(t2) {
          return this.$ms / h[m(t2)];
        }, y2.get = function(t2) {
          var s2 = this.$ms, n2 = m(t2);
          return "milliseconds" === n2 ? s2 %= 1e3 : s2 = "weeks" === n2 ? $(s2 / h[n2]) : this.$d[n2], s2 || 0;
        }, y2.add = function(t2, s2, n2) {
          var i2;
          return i2 = s2 ? t2 * h[m(s2)] : c(t2) ? t2.$ms : f(t2, this).$ms, f(this.$ms + i2 * (n2 ? -1 : 1), this);
        }, y2.subtract = function(t2, s2) {
          return this.add(t2, s2, true);
        }, y2.locale = function(t2) {
          var s2 = this.clone();
          return s2.$l = t2, s2;
        }, y2.clone = function() {
          return f(this.$ms, this);
        }, y2.humanize = function(s2) {
          return t().add(this.$ms, "ms").locale(this.$l).fromNow(!s2);
        }, y2.valueOf = function() {
          return this.asMilliseconds();
        }, y2.milliseconds = function() {
          return this.get("milliseconds");
        }, y2.asMilliseconds = function() {
          return this.as("milliseconds");
        }, y2.seconds = function() {
          return this.get("seconds");
        }, y2.asSeconds = function() {
          return this.as("seconds");
        }, y2.minutes = function() {
          return this.get("minutes");
        }, y2.asMinutes = function() {
          return this.as("minutes");
        }, y2.hours = function() {
          return this.get("hours");
        }, y2.asHours = function() {
          return this.as("hours");
        }, y2.days = function() {
          return this.get("days");
        }, y2.asDays = function() {
          return this.as("days");
        }, y2.weeks = function() {
          return this.get("weeks");
        }, y2.asWeeks = function() {
          return this.as("weeks");
        }, y2.months = function() {
          return this.get("months");
        }, y2.asMonths = function() {
          return this.as("months");
        }, y2.years = function() {
          return this.get("years");
        }, y2.asYears = function() {
          return this.as("years");
        }, l2;
      })(), p = function(t2, s2, n2) {
        return t2.add(s2.years() * n2, "y").add(s2.months() * n2, "M").add(s2.days() * n2, "d").add(s2.hours() * n2, "h").add(s2.minutes() * n2, "m").add(s2.seconds() * n2, "s").add(s2.milliseconds() * n2, "ms");
      };
      return function(n2, i2, e2) {
        t = e2, s = e2().$utils(), e2.duration = function(t2, s2) {
          var n3 = e2.locale();
          return f(t2, { $l: n3 }, s2);
        }, e2.isDuration = c;
        var r2 = i2.prototype.add, o2 = i2.prototype.subtract;
        i2.prototype.add = function(t2, s2) {
          return c(t2) ? p(this, t2, 1) : r2.bind(this)(t2, s2);
        }, i2.prototype.subtract = function(t2, s2) {
          return c(t2) ? p(this, t2, -1) : o2.bind(this)(t2, s2);
        };
      };
    }));
  }
});

// src/server/main.ts
import { appendFileSync as appendFileSync2, mkdirSync as mkdirSync2 } from "node:fs";
import { join as join4 } from "node:path";

// src/core/time.ts
var import_dayjs = __toESM(require_dayjs_min(), 1);
var import_duration = __toESM(require_duration(), 1);
import_dayjs.default.extend(import_duration.default);
var ENRICH_WINDOW = import_dayjs.default.duration(2, "minutes");

// src/node/paths.ts
import { homedir } from "node:os";
import { join } from "node:path";
function dataDir(env = process.env) {
  return env.VIBING_TV_DATA_DIR || join(homedir(), ".vibing-tv");
}
var safeId = (id) => id.replace(/[^A-Za-z0-9_-]/g, "");

// src/node/config.ts
var DEFAULT_PORT = 4317;
var DEFAULT_IDLE_MS = import_dayjs.default.duration(30, "minutes").asMilliseconds();
function positiveInt(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= max ? n : fallback;
}
function readConfig(env = process.env) {
  return {
    port: positiveInt(env.VIBING_TV_PORT, DEFAULT_PORT, 65535),
    dataDir: dataDir(env),
    idleMs: positiveInt(env.VIBING_TV_IDLE_MS, DEFAULT_IDLE_MS),
    coach: env.VIBING_TV_NO_COACH !== "1",
    link: env.VIBING_TV_NO_LINK !== "1"
  };
}

// src/server/http.ts
import { readFileSync as readFileSync2 } from "node:fs";
import http from "node:http";
import { extname, join as join3, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// src/core/protocol.ts
var APP_ID = "vibing-tv";
var SCHEMA_VERSION = 1;
var SSE_EVENT = { event: "ev", patch: "patch" };
var SHUTDOWN_HEADER = "x-vibing-tv-shutdown";
var EventKinds = { Write: "write", Edit: "edit", Todos: "todos" };
var TodoStatuses = { Completed: "completed", InProgress: "in_progress", Pending: "pending" };

// src/node/version.ts
var VERSION = true ? "0.1.0" : packageVersion();

// src/core/transcript.ts
var EntryTypes = { Assistant: "assistant", User: "user" };
var BlockTypes = { Text: "text", ToolUse: "tool_use", ToolResult: "tool_result" };
function parseLines(text) {
  const entries = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed && typeof parsed === "object") entries.push(parsed);
    } catch {
    }
  }
  return entries;
}
var blocks = (entry) => {
  const content = entry.message?.content;
  return Array.isArray(content) ? content : [];
};
var isToolResult = (entry) => blocks(entry).length > 0 && blocks(entry).every((b) => b.type === BlockTypes.ToolResult);
var findToolUse = (entries, toolUseId) => entries.findIndex(
  (e) => e.type === EntryTypes.Assistant && blocks(e).some((b) => b.type === BlockTypes.ToolUse && b.id === toolUseId)
);
var textOf = (entry) => blocks(entry).flatMap((b) => b.type === BlockTypes.Text && b.text ? [b.text] : []);
function explanationFor(transcriptText, toolUseId) {
  const entries = parseLines(transcriptText);
  const at = findToolUse(entries, toolUseId);
  if (at === -1) return null;
  for (let i = at - 1; i >= 0; i--) {
    const e = entries[i];
    if (!e) continue;
    if (e.type === EntryTypes.User && !isToolResult(e)) return null;
    if (e.type !== EntryTypes.Assistant) continue;
    const texts = textOf(e);
    if (!texts.length) continue;
    const all = [texts.join("\n\n")];
    for (let j = i - 1; j >= 0; j--) {
      const prev = entries[j];
      if (prev?.type !== EntryTypes.Assistant || prev.message?.id !== e.message?.id) break;
      const more = textOf(prev);
      if (more.length) all.unshift(more.join("\n\n"));
    }
    return { key: e.uuid ?? "", text: all.join("\n\n") };
  }
  return null;
}
function lastTurnText(transcriptText) {
  const entries = parseLines(transcriptText);
  const texts = [];
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e?.type === EntryTypes.User) break;
    if (e?.type === EntryTypes.Assistant) texts.unshift(...textOf(e));
  }
  return texts.length ? texts.join("\n\n") : null;
}
var CHECKLIST_LINE = /^\s*[-*]\s+\[([ xX])\]\s+(.+?)\s*$/;
function parseChecklist(text) {
  if (!text) return null;
  let current = null;
  let last = null;
  for (const line of text.split("\n")) {
    const m = CHECKLIST_LINE.exec(line);
    if (m) {
      current ??= [];
      current.push({ content: m[2] ?? "", done: m[1] !== " " });
      last = current;
    } else {
      current = null;
    }
  }
  if (!last) return null;
  let open = false;
  return last.map(({ content, done }) => {
    if (done) return { content, status: TodoStatuses.Completed };
    const status = open ? TodoStatuses.Pending : TodoStatuses.InProgress;
    open = true;
    return { content, status };
  });
}

// src/core/event.ts
function resolvePatch(ev, transcriptText) {
  if (ev.file && !ev.explanation) {
    const explanation = explanationFor(transcriptText, ev.id);
    if (!explanation) return null;
    const todos = parseChecklist(explanation.text);
    return { id: ev.id, session_id: ev.session_id, explanation, ...todos ? { todos } : {} };
  }
  if (ev.kind === EventKinds.Todos && !ev.todos) {
    const todos = parseChecklist(lastTurnText(transcriptText));
    return todos ? { id: ev.id, session_id: ev.session_id, todos } : null;
  }
  return null;
}
var needsPatch = (ev) => !!ev.transcript && (!!ev.file && !ev.explanation || ev.kind === EventKinds.Todos && !ev.todos);

// src/node/tail.ts
import { closeSync, fstatSync, openSync, readSync } from "node:fs";
var TAIL_BYTES = 512 * 1024;
function readTranscriptTail(path) {
  const fd = openSync(path, "r");
  try {
    const size = fstatSync(fd).size;
    const length = Math.min(size, TAIL_BYTES);
    const buf = Buffer.alloc(length);
    readSync(fd, buf, 0, length, size - length);
    return buf.toString("utf8");
  } finally {
    closeSync(fd);
  }
}

// src/server/enrich.ts
function createEnricher({
  readTail = readTranscriptTail,
  now = () => (0, import_dayjs.default)()
} = {}) {
  const pending = /* @__PURE__ */ new Map();
  const tryResolve = (evs) => {
    const cache = /* @__PURE__ */ new Map();
    const read = (path) => {
      let text = cache.get(path);
      if (text === void 0) {
        try {
          text = readTail(path);
        } catch {
          text = "";
        }
        cache.set(path, text);
      }
      return text;
    };
    return evs.flatMap((ev) => resolvePatch(ev, read(ev.transcript ?? "")) ?? []);
  };
  return {
    track(events) {
      for (const ev of events) if (needsPatch(ev) && !pending.has(ev.id)) pending.set(ev.id, { ev, since: now() });
    },
    tick() {
      const patches = tryResolve([...pending.values()].map((p) => p.ev));
      for (const p of patches) pending.delete(p.id);
      for (const [id, p] of pending) if (now().isAfter(p.since.add(ENRICH_WINDOW))) pending.delete(id);
      return patches;
    },
    resolveNow: (events) => tryResolve(events.filter(needsPatch))
  };
}

// src/server/store.ts
import {
  appendFileSync,
  closeSync as closeSync2,
  mkdirSync,
  openSync as openSync2,
  readdirSync,
  readFileSync,
  readSync as readSync2,
  rmSync,
  statSync
} from "node:fs";
import { join as join2 } from "node:path";
function parseComplete(text) {
  const end = text.lastIndexOf("\n");
  const items = [];
  for (const line of text.slice(0, end + 1).split("\n")) {
    if (!line.trim()) continue;
    try {
      items.push(JSON.parse(line));
    } catch {
    }
  }
  return { items, consumed: Buffer.byteLength(text.slice(0, end + 1)) };
}
function readFrom(file, offset) {
  const fd = openSync2(file, "r");
  try {
    const size = statSync(file).size;
    if (size <= offset) return "";
    const buf = Buffer.alloc(size - offset);
    readSync2(fd, buf, 0, buf.length, offset);
    return buf.toString("utf8");
  } finally {
    closeSync2(fd);
  }
}
function createStore(dataDir2) {
  const dir = join2(dataDir2, "sessions");
  const offsets = /* @__PURE__ */ new Map();
  const patchFile = (sessionId) => join2(dir, `${safeId(sessionId)}.patches`);
  const withPatches = (sessionId, events) => {
    let patches = [];
    try {
      patches = parseComplete(readFileSync(patchFile(sessionId), "utf8")).items;
    } catch {
    }
    if (!patches.length) return events;
    const byId = new Map(patches.map((p) => [p.id, p]));
    return events.map((e) => ({ ...e, ...byId.get(e.id) }));
  };
  const files = () => {
    try {
      return readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
    } catch {
      return [];
    }
  };
  const readAll = (file) => {
    try {
      return parseComplete(readFileSync(join2(dir, file), "utf8")).items;
    } catch {
      return [];
    }
  };
  return {
    listSessions() {
      return files().map((f) => {
        const events = readAll(f);
        const last_ts = events.reduce((max, e) => e.ts > (max ?? "") ? e.ts : max, null);
        return { session_id: f.slice(0, -6), cwd: events.at(-1)?.cwd ?? null, last_ts, count: events.length };
      }).filter((s) => s.count > 0).sort((a, b) => String(b.last_ts).localeCompare(String(a.last_ts)));
    },
    history(sessionId) {
      const f = `${safeId(sessionId)}.jsonl`;
      return files().includes(f) ? withPatches(sessionId, readAll(f)) : [];
    },
    addPatch(patch) {
      mkdirSync(dir, { recursive: true });
      appendFileSync(patchFile(patch.session_id), JSON.stringify(patch) + "\n");
    },
    poll() {
      const out = [];
      for (const f of files()) {
        const offset = offsets.get(f) ?? 0;
        const { items, consumed } = parseComplete(readFrom(join2(dir, f), offset));
        offsets.set(f, offset + consumed);
        out.push(...items);
      }
      return out;
    },
    prune(maxAgeMs) {
      let removed = 0;
      const limit = (0, import_dayjs.default)().subtract(maxAgeMs, "ms");
      for (const f of files()) {
        const p = join2(dir, f);
        try {
          if ((0, import_dayjs.default)(statSync(p).mtime).isBefore(limit)) {
            rmSync(p, { force: true });
            rmSync(patchFile(f.slice(0, -6)), { force: true });
            offsets.delete(f);
            removed++;
          }
        } catch {
        }
      }
      return removed;
    }
  };
}

// src/server/http.ts
var HOST = "127.0.0.1";
var POLL_MS = 300;
var PING_EVERY = import_dayjs.default.duration(15, "seconds");
var TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2"
};
var SEGMENT = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;
var DEFAULT_VIEWER = fileURLToPath(new URL("../viewer/", import.meta.url));
function viewerPath(viewerDir, rawPath) {
  let segments;
  try {
    segments = rawPath.split("/").map(decodeURIComponent);
  } catch {
    return null;
  }
  if (!segments.length || !segments.every((s) => SEGMENT.test(s))) return null;
  const root = resolve(viewerDir);
  const file = resolve(join3(root, ...segments));
  return file.startsWith(root + sep) && extname(file) in TYPES ? file : null;
}
function startServer({
  port,
  dataDir: dataDir2,
  idleMs,
  version = VERSION,
  viewerDir = DEFAULT_VIEWER,
  log: log2 = () => void 0,
  enricher = createEnricher()
}) {
  const store = createStore(dataDir2);
  store.poll();
  const clients = /* @__PURE__ */ new Set();
  let lastActivity = (0, import_dayjs.default)();
  let boundPort = port;
  const json = (res, body) => {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };
  const status = (res, code) => {
    res.writeHead(code, { "content-type": "text/plain" });
    res.end(code === 404 ? "not found" : "");
  };
  const serveFile = (res, file) => {
    if (!file) {
      status(res, 404);
      return;
    }
    try {
      const body = readFileSync2(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)], "cache-control": "no-store" });
      res.end(body);
    } catch {
      status(res, 404);
    }
  };
  const broadcast = (event, data) => {
    for (const c of clients) c.write(`event: ${event}
data: ${JSON.stringify(data)}

`);
  };
  const server = http.createServer((req, res) => {
    const host = req.headers.host ?? "";
    if (host !== `${HOST}:${boundPort}` && host !== `localhost:${boundPort}`) {
      status(res, 403);
      return;
    }
    const url = new URL(req.url ?? "/", `http://${HOST}`);
    if (req.method === "POST" && url.pathname === "/shutdown") {
      if (req.headers[SHUTDOWN_HEADER] !== "1") {
        status(res, 403);
        return;
      }
      res.writeHead(204).end(() => {
        log2("shutdown requested");
        void close();
      });
      return;
    }
    if (req.method !== "GET") {
      status(res, 404);
      return;
    }
    switch (url.pathname) {
      case "/health": {
        lastActivity = (0, import_dayjs.default)();
        const health = { app: APP_ID, version, schema: SCHEMA_VERSION, dataDir: dataDir2, pid: process.pid };
        json(res, health);
        return;
      }
      case "/sessions":
        json(res, store.listSessions());
        return;
      case "/history": {
        const sid = url.searchParams.get("session") ?? "";
        enricher.resolveNow(store.history(sid)).forEach((p) => {
          store.addPatch(p);
        });
        json(res, store.history(sid));
        return;
      }
      case "/":
        serveFile(res, viewerPath(viewerDir, "index.html"));
        return;
      case "/events":
        res.writeHead(200, {
          "content-type": "text/event-stream",
          "cache-control": "no-store",
          connection: "keep-alive"
        });
        res.write(": connected\n\n");
        clients.add(res);
        req.on("close", () => {
          clients.delete(res);
          lastActivity = (0, import_dayjs.default)();
        });
        return;
    }
    if (url.pathname.startsWith("/viewer/"))
      serveFile(res, viewerPath(viewerDir, url.pathname.slice("/viewer/".length)));
    else status(res, 404);
  });
  let closedResolve = () => void 0;
  const closed = new Promise((r) => closedResolve = r);
  const timers = [];
  let closing = null;
  const close = () => closing ??= new Promise((done) => {
    timers.forEach(clearInterval);
    for (const c of clients) c.end();
    server.close(() => {
      closedResolve();
      done();
    });
    server.closeAllConnections();
  });
  timers.push(
    setInterval(
      () => {
        const events = store.poll();
        if (events.length) lastActivity = (0, import_dayjs.default)();
        for (const e of events) broadcast(SSE_EVENT.event, e);
        enricher.track(events);
        for (const p of enricher.tick()) {
          store.addPatch(p);
          broadcast(SSE_EVENT.patch, p);
        }
        if (clients.size === 0 && (0, import_dayjs.default)().isAfter(lastActivity.add(idleMs, "ms"))) {
          log2("idle, shutting down");
          void close();
        }
      },
      Math.min(POLL_MS, idleMs)
    ),
    setInterval(() => {
      for (const c of clients) c.write(": ping\n\n");
    }, PING_EVERY.asMilliseconds())
  );
  return new Promise((resolveStart, reject) => {
    server.once("error", (e) => {
      timers.forEach(clearInterval);
      reject(e);
    });
    server.listen(port, HOST, () => {
      const addr = server.address();
      boundPort = addr.port;
      log2(`listening on ${addr.address}:${addr.port}`);
      resolveStart({ port: addr.port, address: addr.address, close, closed });
    });
  });
}

// src/server/main.ts
var RETENTION = import_dayjs.default.duration(7, "days");
var config = readConfig();
var log = (msg) => {
  try {
    appendFileSync2(join4(config.dataDir, "server.log"), `${(0, import_dayjs.default)().toISOString()} ${msg}
`);
  } catch {
  }
};
try {
  mkdirSync2(config.dataDir, { recursive: true });
  const server = await startServer({ port: config.port, dataDir: config.dataDir, idleMs: config.idleMs, log });
  createStore(config.dataDir).prune(RETENTION.asMilliseconds());
  await server.closed;
} catch (e) {
  log(`failed: ${e instanceof Error ? e.message : String(e)}`);
}
process.exit(0);
