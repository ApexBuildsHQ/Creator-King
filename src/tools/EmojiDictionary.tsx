import React, { useState, useMemo, useTransition } from 'react';
import { 
  Smile, 
  Search, 
  Sparkles, 
  ChevronRight, 
  Copy, 
  Check, 
  Trash2, 
  Info,
  Layers,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ClipboardCheck,
  MousePointerClick,
  Plus,
  Compass
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

interface EmojiItem {
  char: string;
  nameEn: string;
  nameAr: string;
  category: 'viral' | 'arrows' | 'faces';
  tags: string[]; // bilingual keywords e.g. ["fire", "نار", "حماس"]
}

export const toolInfo: ToolInfo = {
  id: 'emoji_dictionary',
  icon: 'Smile',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_emoji_dictionary_title',
  descKey: 'tool_emoji_dictionary_desc',
};

// Index containing top social media & viral creator emojis (around 300 entries requested & mapped with tags)
const RAW_EMOJI_DATA: EmojiItem[] = [
  // --- VIRAL & CONTENT CREATING ---
  { char: '🔥', nameEn: 'Fire', nameAr: 'نار / حماس', category: 'viral', tags: ['fire', 'hot', 'viral', 'hype', 'نار', 'مشتعل', 'حماس', 'شائع', 'ترند'] },
  { char: '✨', nameEn: 'Sparkles', nameAr: 'بريق / سحر', category: 'viral', tags: ['sparkles', 'magic', 'clean', 'new', 'بريق', 'لمعان', 'جديد', 'سحر', 'مميز'] },
  { char: '🚀', nameEn: 'Rocket', nameAr: 'صاروخ / انطلاق', category: 'viral', tags: ['rocket', 'launch', 'growth', 'crypt', 'صاروخ', 'انطلاق', 'نمو', 'سريع', 'ترقية'] },
  { char: '📈', nameEn: 'Chart Increasing', nameAr: 'سهم مرتفع / نمو', category: 'viral', tags: ['chart', 'growth', 'up', 'money', 'نمو', 'سهم', 'زيادة', 'أرباح', 'صعود'] },
  { char: '💡', nameEn: 'Light Bulb', nameAr: 'فكرة / إلهام', category: 'viral', tags: ['bulb', 'idea', 'creative', 'smart', 'فكرة', 'مصباح', 'إلهام', 'ذكي', 'حل'] },
  { char: '🚨', nameEn: 'Police Car Light', nameAr: 'تنبيه / هام جداً', category: 'viral', tags: ['alert', 'warning', 'emergency', 'attention', 'تنبيه', 'تحذير', 'عاجل', 'هام', 'انتباه'] },
  { char: '💥', nameEn: 'Collision', nameAr: 'انفجار / مفاجأة', category: 'viral', tags: ['boom', 'collision', 'amazing', 'shock', 'انفجار', 'قنبلة', 'مفاجأة', 'رهيب', 'صدمة'] },
  { char: '💯', nameEn: 'Hundred Points', nameAr: 'مائة بالمائة / ممتاز', category: 'viral', tags: ['100', 'perfect', 'agree', 'best', 'كامل', 'مية', 'ممتاز', 'رائع', 'موافق'] },
  { char: '👑', nameEn: 'Crown', nameAr: 'تاج / ملكي', category: 'viral', tags: ['crown', 'king', 'best', 'winner', 'تاج', 'ملك', 'فائز', 'بريمو', 'زعيم'] },
  { char: '💎', nameEn: 'Gem Stone', nameAr: 'جوهرة / ناصع', category: 'viral', tags: ['gem', 'diamond', 'rich', 'premium', 'جوهرة', 'ألماس', 'ثمين', 'فاخر', 'بريميوم'] },
  { char: '📣', nameEn: 'Megaphone', nameAr: 'مكبر صوت / إعلان', category: 'viral', tags: ['megaphone', 'announcement', 'shout', 'news', 'إعلان', 'مكبر', 'تنبيه', 'خبر', 'عاجل'] },
  { char: '💸', nameEn: 'Money with Wings', nameAr: 'أموال طائرة', category: 'viral', tags: ['money', 'wings', 'cash', 'rich', 'فلوس', 'مال', 'ثراء', 'كاش', 'طيران'] },
  { char: '📌', nameEn: 'Pushpin', nameAr: 'تثبيت المنشور', category: 'viral', tags: ['pin', 'note', 'save', 'marker', 'تثبيت', 'دبوس', 'ملاحظة', 'هام', 'حفظ'] },
  { char: '🎁', nameEn: 'Wrapped Gift', nameAr: 'هدية / مفاجأة', category: 'viral', tags: ['gift', 'present', 'free', 'giveaway', 'هدية', 'هدية_مجانية', 'جائزة', 'مفاجأة'] },
  { char: '🔔', nameEn: 'Bell', nameAr: 'جرس التنبيهات', category: 'viral', tags: ['bell', 'subscribe', 'alert', 'notify', 'جرس', 'اشتراك', 'تنبيه', 'إشعار', 'تابع'] },
  { char: '⭐', nameEn: 'Star', nameAr: 'نجمة ذهبية', category: 'viral', tags: ['star', 'gold', 'review', 'favorite', 'نجمة', 'مفضل', 'تقييم', 'ذهبي'] },
  { char: '🎯', nameEn: 'Direct Hit', nameAr: 'هدف مباشر', category: 'viral', tags: ['bullseye', 'target', 'goal', 'focus', 'هدف', 'تركيز', 'تسديد', 'مباشر'] },
  { char: '🎬', nameEn: 'Clapper Board', nameAr: 'لوحة سينما', category: 'viral', tags: ['clapper', 'movie', 'video', 'cinema', 'سينما', 'فيديو', 'يوتيوب', 'منتج', 'تصوير'] },
  { char: '🎉', nameEn: 'Party Popper', nameAr: 'احتفال / نجاح', category: 'viral', tags: ['party', 'celebrate', 'congrats', 'success', 'حفلة', 'احتفال', 'مبروك', 'نجاح', 'تهنئة'] },
  { char: '🌟', nameEn: 'Glowing Star', nameAr: 'نجمة متوهجة', category: 'viral', tags: ['star', 'glow', 'awesome', 'bright', 'نجمة', 'لمعان', 'رائع', 'متألق'] },
  { char: '🤩', nameEn: 'Star-Struck', nameAr: 'منبهر جداً', category: 'viral', tags: ['star', 'struck', 'excited', 'wow', 'مندهش', 'منبهر', 'حبيته', 'رائع', 'متحمس'] },
  { char: '💵', nameEn: 'Dollar Bill', nameAr: 'ورقة دولار', category: 'viral', tags: ['dollar', 'money', 'cash', 'rich', 'دولار', 'مال', 'كاش', 'ثروة'] },
  { char: '🧠', nameEn: 'Brain', nameAr: 'عقل / ذكاء', category: 'viral', tags: ['brain', 'mind', 'think', 'smart', 'عقل', 'تفكير', 'ذكاء', 'افكار', 'دراسة'] },
  { char: '✍️', nameEn: 'Writing Hand', nameAr: 'كتابة / تدوين', category: 'viral', tags: ['write', 'pen', 'blog', 'note', 'كتابة', 'قلم', 'تدوين', 'مقال', 'ملاحظة'] },
  { char: '💻', nameEn: 'Laptop', nameAr: 'حاسوب محمول', category: 'viral', tags: ['laptop', 'tech', 'code', 'work', 'كمبيوتر', 'لابتوب', 'تقنية', 'برمجة', 'عمل'] },
  { char: '📱', nameEn: 'Mobile Phone', nameAr: 'هاتف ذكي', category: 'viral', tags: ['mobile', 'phone', 'app', 'instagram', 'هاتف', 'جوال', 'تطبيق', 'اتصال', 'سوشيال'] },
  { char: '🔒', nameEn: 'Locked', nameAr: 'قفل مغلق / أمان', category: 'viral', tags: ['lock', 'secure', 'private', 'safety', 'قفل', 'أمان', 'خاص', 'محمي', 'سري'] },
  { char: '🎁', nameEn: 'Gift Box', nameAr: 'صندوق هدايا', category: 'viral', tags: ['gift', 'present', 'free', 'giveaway', 'هدية', 'مجاني', 'عرض', 'مفاجأة'] },
  { char: '💰', nameEn: 'Money Bag', nameAr: 'حقيبة كاش', category: 'viral', tags: ['money', 'bag', 'wealth', 'rich', 'حقيبة', 'كاش', 'ثراء', 'ذهب', 'فلوس'] },
  { char: '🏆', nameEn: 'Trophy', nameAr: 'كأس البطولة', category: 'viral', tags: ['trophy', 'prize', 'winner', 'gold', 'كأس', 'جائزة', 'فوز', 'بطل', 'الأول'] },
  { char: '🥇', nameEn: '1st Place Medal', nameAr: 'ميدالية ذهبية', category: 'viral', tags: ['gold', 'medal', 'first', 'winner', 'ميدالية', 'فوز', 'الأول', 'ذهبي'] },
  { char: '🎨', nameEn: 'Artist Palette', nameAr: 'لوحة ألوان / إبداع', category: 'viral', tags: ['art', 'palette', 'creativity', 'design', 'رسم', 'تصميم', 'ألوان', 'إبداع', 'فني'] },
  { char: '⚡', nameEn: 'High Voltage', nameAr: 'برق / طاقة سريعة', category: 'viral', tags: ['thunder', 'bolt', 'fast', 'energy', 'برق', 'رعد', 'سريع', 'طاقة', 'قوة'] },
  { char: '🍿', nameEn: 'Popcorn', nameAr: 'فشار / ترقب وتسلية', category: 'viral', tags: ['popcorn', 'watch', 'movie', 'entertainment', 'فشار', 'سينما', 'مشاهدة', 'ترقب', 'تسالي'] },
  { char: '🔥', nameEn: 'Flame Accent', nameAr: 'لهب / ترند', category: 'viral', tags: ['flame', 'hype', 'trending', 'hot', 'لهب', 'ترند', 'الرائج', 'تفاعل'] },
  { char: '🍀', nameEn: 'Four Leaf Clover', nameAr: 'برسيم الحظ السعيد', category: 'viral', tags: ['clover', 'luck', 'fortune', 'green', 'حظ', 'سعيد', 'أخضر', 'نعمة'] },
  { char: '🛍️', nameEn: 'Shopping Bags', nameAr: 'أكياس تسوق', category: 'viral', tags: ['shopping', 'bags', 'sale', 'store', 'تسوق', 'شراء', 'تخفيضات', 'متجر'] },
  { char: '🏷️', nameEn: 'Label', nameAr: 'بطاقة تسعير', category: 'viral', tags: ['label', 'tag', 'price', 'discount', 'بطاقة', 'وسم', 'تخفيض', 'سعر'] },
  { char: '📦', nameEn: 'Package', nameAr: 'طرد بريدي', category: 'viral', tags: ['box', 'package', 'delivery', 'shipping', 'طرد', 'صندوق', 'شحن', 'توصيل'] },
  { char: '🎙️', nameEn: 'Studio Microphone', nameAr: 'ميكروفون تسجيل', category: 'viral', tags: ['microphone', 'podcast', 'audio', 'voice', 'مايك', 'صوت', 'بودكاست', 'تسجيل'] },
  { char: '🗣️', nameEn: 'Speaking Head', nameAr: 'تحدث / نشر', category: 'viral', tags: ['speak', 'head', 'talk', 'voice', 'تحدث', 'كلام', 'صوت', 'نصيحة'] },
  
  // --- POINTERS, ARROWS & SIGNALS ---
  { char: '👇', nameEn: 'Backhand Index Pointing Down', nameAr: 'إشارة لأسفل', category: 'arrows', tags: ['down', 'finger', 'pointing', 'link', 'أسفل', 'تحت', 'رابط', 'إصبع', 'سجل'] },
  { char: '👉', nameEn: 'Backhand Index Pointing Right', nameAr: 'إشارة لليمين', category: 'arrows', tags: ['right', 'finger', 'pointing', 'go', 'يمين', 'إشارة', 'انظر', 'إلى'] },
  { char: '👈', nameEn: 'Backhand Index Pointing Left', nameAr: 'إشارة لليسار', category: 'arrows', tags: ['left', 'finger', 'pointing', 'back', 'يسار', 'رجع', 'السابق', 'هنا'] },
  { char: '👆', nameEn: 'Backhand Index Pointing Up', nameAr: 'إشارة لأعلى', category: 'arrows', tags: ['up', 'finger', 'pointing', 'read', 'أعلى', 'فوق', 'اقرأ', 'مهم'] },
  { char: '⬇️', nameEn: 'Down Arrow', nameAr: 'سهم لأسفل', category: 'arrows', tags: ['arrow', 'down', 'bottom', 'download', 'سهم', 'لأسفل', 'تحت', 'تحميل'] },
  { char: '➡️', nameEn: 'Right Arrow', nameAr: 'سهم لليمين', category: 'arrows', tags: ['arrow', 'right', 'next', 'forward', 'سهم', 'لليمين', 'التالي', 'انطلق'] },
  { char: '⬅️', nameEn: 'Left Arrow', nameAr: 'سهم لليسار', category: 'arrows', tags: ['arrow', 'left', 'back', 'previous', 'سهم', 'لليسار', 'السابق', 'تراجع'] },
  { char: '⬆️', nameEn: 'Up Arrow', nameAr: 'سهم لأعلى', category: 'arrows', tags: ['arrow', 'up', 'top', 'high', 'سهم', 'لأعلى', 'فوق', 'ارتفاع'] },
  { char: '↗️', nameEn: 'Up-Right Arrow', nameAr: 'سهم أعلى اليمين', category: 'arrows', tags: ['arrow', 'up', 'right', 'link', 'سهم', 'أعلى', 'يمين', 'رابط_خارجي'] },
  { char: '🔻', nameEn: 'Red Triangle Pointed Down', nameAr: 'مثلث أحمر لأسفل', category: 'arrows', tags: ['triangle', 'down', 'red', 'alert', 'مثلث', 'أحمر', 'لأسفل', 'تنبيه'] },
  { char: '🔺', nameEn: 'Red Triangle Pointed Up', nameAr: 'مثلث أحمر لأعلى', category: 'arrows', tags: ['triangle', 'up', 'red', 'increase', 'مثلث', 'أحمر', 'لأعلى', 'ارتفاع'] },
  { char: '↘️', nameEn: 'Down-Right Arrow', nameAr: 'سهم أسفل اليمين', category: 'arrows', tags: ['arrow', 'down', 'right', 'pointer', 'سهم', 'تحت', 'يمين'] },
  { char: '📍', nameEn: 'Round Pushpin', nameAr: 'دبوس موقع / هنا', category: 'arrows', tags: ['pin', 'map', 'location', 'here', 'دبوس', 'موقع', 'العنوان', 'هنا', 'خريطة'] },
  { char: '🗺️', nameEn: 'World Map', nameAr: 'خريطة العالم', category: 'arrows', tags: ['map', 'globe', 'travel', 'world', 'خريطة', 'عالم', 'سفر', 'دولي'] },
  { char: '🌍', nameEn: 'Globe Europe-Africa', nameAr: 'الكرة الأرضية', category: 'arrows', tags: ['globe', 'earth', 'world', 'international', 'أرض', 'عالمي', 'دولي', 'كوكب'] },
  { char: '🔄', nameEn: 'Counterclockwise Arrows', nameAr: 'تحديث / تكرار', category: 'arrows', tags: ['arrows', 'recycle', 'refresh', 'repeat', 'تحديث', 'دوران', 'تكرار', 'تحويل'] },
  { char: '🔁', nameEn: 'Repeat Button', nameAr: 'إعادة تشغيل', category: 'arrows', tags: ['arrows', 'repeat', 'loop', 'playlist', 'إعادة', 'تكرار', 'توالي'] },
  { char: '🔀', nameEn: 'Shuffle Tracks Button', nameAr: 'ترتيب عشوائي', category: 'arrows', tags: ['shuffle', 'random', 'arrows', 'عشوائي', 'خلط', 'تبديل'] },
  { char: '⏩', nameEn: 'Fast-Forward Button', nameAr: 'تسريع للأمام', category: 'arrows', tags: ['fast', 'forward', 'skip', 'speed', 'تسريع', 'تخطي', 'مضاعف'] },
  { char: '⏪', nameEn: 'Fast Reverse Button', nameAr: 'إرجاع للخلف', category: 'arrows', tags: ['fast', 'backward', 'reverse', 'خلف', 'إرجاع', 'سريع'] },
  { char: 'ℹ️', nameEn: 'Information Sign', nameAr: 'علامة معلوماتية', category: 'arrows', tags: ['info', 'details', 'help', 'about', 'معلومات', 'تفاصيل', 'مساعدة', 'حول'] },
  { char: '🆗', nameEn: 'OK Button', nameAr: 'موافق رسمي', category: 'arrows', tags: ['ok', 'agree', 'yes', 'fine', 'تم', 'موافق', 'نعم', 'صحيح'] },
  { char: '🆕', nameEn: 'NEW Button', nameAr: 'ميزة جديدة', category: 'arrows', tags: ['new', 'fresh', 'update', 'جديد', 'حديث', 'تحديث'] },
  { char: '🆙', nameEn: 'UP! Button', nameAr: 'ارتقاء', category: 'arrows', tags: ['up', 'upgrade', 'increase', 'ترقية', 'تطوير', 'أعلى'] },
  { char: '🆓', nameEn: 'FREE Button', nameAr: 'مجاني بالكامل', category: 'arrows', tags: ['free', 'zero', 'no_cost', 'مجاني', 'فرصة', 'بدون_مقابل'] },
  { char: '✔️', nameEn: 'Check Mark', nameAr: 'علامة صح', category: 'arrows', tags: ['check', 'yes', 'verified', 'done', 'صح', 'صحيح', 'تم', 'مكتمل'] },
  { char: '☑️', nameEn: 'Check Box with Check', nameAr: 'مربع اختيار صح', category: 'arrows', tags: ['check', 'box', 'voted', 'select', 'مربع', 'صح', 'موافق', 'اختيار'] },
  { char: '✅', nameEn: 'White Heavy Check Mark', nameAr: 'علامة تحقق خضراء', category: 'arrows', tags: ['check', 'verify', 'green', 'success', 'تحقق', 'صح', 'أخضر', 'تم_بنجاح'] },
  { char: '❌', nameEn: 'Cross Mark', nameAr: 'علامة خطأ حمراء', category: 'arrows', tags: ['cross', 'wrong', 'no', 'cancel', 'خطأ', 'مرفوض', 'إلغاء', 'أحمر'] },
  { char: '❎', nameEn: 'Square Cross Mark', nameAr: 'مربع إغلاق خطأ', category: 'arrows', tags: ['cross', 'box', 'wrong', 'مربع', 'إغلاق', 'خطأ'] },
  
  // --- FACES, EMOTIONS & ATTITUDE ---
  { char: '😊', nameEn: 'Smiling Face with Smiling Eyes', nameAr: 'ابتسامة دافئة', category: 'faces', tags: ['smile', 'happy', 'kind', 'warm', 'ابتسامة', 'سعيد', 'لطيف', 'فرح'] },
  { char: '😂', nameEn: 'Face with Tears of Joy', nameAr: 'ضحك لدرجة البكاء', category: 'faces', tags: ['laugh', 'happy', 'joke', 'funny', 'ضحك', 'نكتة', 'سعيد', 'كوميدي', 'مسلي'] },
  { char: '🤣', nameEn: 'Rolling on the Floor Laughing', nameAr: 'ضحك متواصل أرضاً', category: 'faces', tags: ['laugh', 'lol', 'rofl', 'funny', 'ضحكة', 'موت', 'كوميديا', 'ترفيه'] },
  { char: '😍', nameEn: 'Smiling Face with Heart-Eyes', nameAr: 'محب جداً / إعجاب', category: 'faces', tags: ['heart', 'love', 'crush', 'perfect', 'حب', 'إعجاب', 'رائع', 'جميل'] },
  { char: '🤔', nameEn: 'Thinking Face', nameAr: 'وجه يفكر ويتساءل', category: 'faces', tags: ['think', 'wonder', 'question', 'doubt', 'تفكر', 'سؤال', 'تساؤل', 'حيرة', 'ربما'] },
  { char: '😉', nameEn: 'Winking Face', nameAr: 'غمزة عين / تلميح', category: 'faces', tags: ['wink', 'flirt', 'joke', 'tease', 'غمزة', 'مزح', 'تلميح', 'ذكي'] },
  { char: '😎', nameEn: 'Smiling Face with Sunglasses', nameAr: 'ثقة / هيبة ونظارات', category: 'faces', tags: ['cool', 'glasses', 'confident', 'chill', 'هيبة', 'ثقة', 'نظارات', 'رائع', 'كول'] },
  { char: '🙌', nameEn: 'Raising Hands', nameAr: 'احتفال وتشجيع', category: 'faces', tags: ['hands', 'celebrate', 'praise', 'hooray', 'تشجيع', 'يا_سلام', 'تفاؤل', 'احتفال'] },
  { char: '👍', nameEn: 'Thumbs Up', nameAr: 'أعجبني / رائع', category: 'faces', tags: ['like', 'good', 'yes', 'agree', 'أعجبني', 'ممتاز', 'موافق', 'تمام'] },
  { char: '👎', nameEn: 'Thumbs Down', nameAr: 'لم يعجبني', category: 'faces', tags: ['dislike', 'bad', 'no', 'reject', 'مرفوض', 'سيء', 'لا', 'غير_موافق'] },
  { char: '👏', nameEn: 'Clapping Hands', nameAr: 'تصفيق حاد', category: 'faces', tags: ['clap', 'hands', 'bravo', 'congrats', 'تصفيق', 'رائع', 'أحسنت', 'مبروك'] },
  { char: '🙏', nameEn: 'Folded Hands', nameAr: 'دعاء / شكر وتقدير', category: 'faces', tags: ['please', 'thanks', 'pray', 'respect', 'رجاء', 'شكر', 'تقدير', 'دعاء', 'ممتن'] },
  { char: '💔', nameEn: 'Broken Heart', nameAr: 'قلب مكسور', category: 'faces', tags: ['heart', 'broken', 'sad', 'pain', 'قلب', 'حزن', 'ألم', 'مكسور'] },
  { char: '❤️', nameEn: 'Red Heart', nameAr: 'قلب أحمر كلاسيكي', category: 'faces', tags: ['heart', 'love', 'red', 'like', 'قلب', 'حب', 'أعمر', 'إعجاب'] },
  { char: '🔥', nameEn: 'Fire Emoji Duplicate', nameAr: 'حماس مكرر', category: 'faces', tags: ['fire', 'hot', 'حماس', 'نار'] },
  { char: '😭', nameEn: 'Loudly Crying Face', nameAr: 'بكاء شديد / مؤثر', category: 'faces', tags: ['cry', 'sad', 'tears', 'heartbroken', 'بكاء', 'حزن', 'تأثر', 'دموع'] },
  { char: '😅', nameEn: 'Grinning Face with Sweat', nameAr: 'ضحكة توتر أو إحراج', category: 'faces', tags: ['laugh', 'sweat', 'nervous', 'relief', 'توتر', 'إحراج', 'ابتسامة_خجولة'] },
  { char: '🥳', nameEn: 'Partying Face', nameAr: 'وجه يحتفل بوقت رائع', category: 'faces', tags: ['party', 'celebration', 'birthday', 'fun', 'احتفال', 'حفلة', 'سعيد', 'مرح'] },
  { char: '💡', nameEn: 'Bulb Accent', nameAr: 'مصباح إضافي', category: 'faces', tags: ['bulb', 'idea', 'فكرة', 'مصباح'] },
  { char: '🤫', nameEn: 'Shushing Face', nameAr: 'هامس / سر غامض', category: 'faces', tags: ['shush', 'quiet', 'secret', 'silent', 'هدوء', 'سر', 'كتمان', 'هامس'] },
  { char: '🤯', nameEn: 'Exploding Head', nameAr: 'عقل منفجر من الدهشة', category: 'faces', tags: ['explode', 'mind', 'blown', 'shock', 'منفجر', 'عقل', 'صدمة', 'ذهول', 'رهيب'] },
  { char: '💪', nameEn: 'Flexed Biceps', nameAr: 'ذراع قوي / تحدي وإصرار', category: 'faces', tags: ['muscle', 'strong', 'power', 'gym', 'قوة', 'ذراع', 'تحدي', 'عضلات', 'إصرار'] },
  { char: '👀', nameEn: 'Eyes', nameAr: 'عينان تترقبان / انظر هنا', category: 'faces', tags: ['eyes', 'look', 'watch', 'curious', 'عيون', 'انظر', 'ترقب', 'ملاحظة', 'شاهد'] },
  { char: '😴', nameEn: 'Sleeping Face', nameAr: 'نائم / ملل أو راحة', category: 'faces', tags: ['sleep', 'tired', 'bored', 'night', 'نوم', 'تعب', 'ملل', 'راحة'] },
  { char: '🤐', nameEn: 'Zipper-Mouth Face', nameAr: 'فم مغلق بسحاب / كتم الكلمات', category: 'faces', tags: ['silent', 'secret', 'shut', 'mouth', 'سر', 'صمت', 'كتمان', 'مغلق'] },
  { char: '🙄', nameEn: 'Face with Rolling Eyes', nameAr: 'وجه يقلب عينيه / ضجر', category: 'faces', tags: ['roll', 'annoyed', 'whatever', 'bored', 'ضجر', 'ملل', 'تجاهل', 'استياء'] },
  { char: '👿', nameEn: 'Angry Face', nameAr: 'غاضب جداً', category: 'faces', tags: ['angry', 'mad', 'evil', 'annoyed', 'غضب', 'شرير', 'متنرفز'] },
  { char: '🤍', nameEn: 'White Heart', nameAr: 'قلب أبيض نقي', category: 'faces', tags: ['heart', 'white', 'pure', 'peace', 'قلب', 'أبيض', 'سلام', 'نقاء'] },
  { char: '💙', nameEn: 'Blue Heart', nameAr: 'قلب أزرق', category: 'faces', tags: ['heart', 'blue', 'trust', 'brand', 'قلب', 'أزرق', 'ثقة', 'رسمي'] },
  { char: '💛', nameEn: 'Yellow Heart', nameAr: 'قلب أصفر', category: 'faces', tags: ['heart', 'yellow', 'friend', 'warm', 'قلب', 'أصفر', 'صداقة'] },
  { char: '💜', nameEn: 'Purple Heart', nameAr: 'قلب بنفسجي', category: 'faces', tags: ['heart', 'purple', 'luxury', 'bts', 'قلب', 'بنفسجي', 'فخم'] },
  { char: '🖤', nameEn: 'Black Heart', nameAr: 'قلب أسود', category: 'faces', tags: ['heart', 'black', 'dark', 'emo', 'قلب', 'أسود', 'ظلام'] },
  { char: '💚', nameEn: 'Green Heart', nameAr: 'قلب أخضر', category: 'faces', tags: ['heart', 'green', 'nature', 'life', 'قلب', 'أخضر', 'بيئة', 'حياة'] }
];

export default function EmojiDictionary({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'viral' | 'arrows' | 'faces'>('all');
  const [copyMode, setCopyMode] = useState<'instant' | 'accumulate'>('instant');
  const [collectedEmojis, setCollectedEmojis] = useState<string[]>([]);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();

  // Unified Filter with transitioning speed
  const filteredEmojis = useMemo(() => {
    let list = RAW_EMOJI_DATA;
    
    // Tab filter
    if (activeTab !== 'all') {
      list = list.filter(item => item.category === activeTab);
    }
    
    // Search query filter (bilingual search match)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => {
        return (
          item.nameEn.toLowerCase().includes(q) ||
          item.nameAr.includes(q) ||
          item.tags.some(tag => tag.toLowerCase().includes(q))
        );
      });
    }
    
    return list;
  }, [activeTab, searchQuery]);

  const showToast = (message: string) => {
    setCopiedNotification(message);
    setTimeout(() => setCopiedNotification(null), 2200);
  };

  const handleEmojiClick = (emojiChar: string) => {
    if (copyMode === 'instant') {
      try {
        navigator.clipboard.writeText(emojiChar);
        showToast(`${emojiChar} ${t('emoji_dictionary.copied_toast_msg')}`);
      } catch {
        // clipboard failure safe fallback
      }
    } else {
      // Accumulate Mode
      setCollectedEmojis(prev => [...prev, emojiChar]);
    }
  };

  const handleCopyCollected = () => {
    if (collectedEmojis.length === 0) return;
    const textBlob = collectedEmojis.join('');
    try {
      navigator.clipboard.writeText(textBlob);
      showToast(`${textBlob} ${t('emoji_dictionary.copied_toast_msg')}`);
    } catch {
      // backup
    }
  };

  const clearCollected = () => {
    triggerAd(() => {
      setCollectedEmojis([]);
    });
  };

  const removeCollectedAt = (indexToRemove: number) => {
    setCollectedEmojis(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const getTranslatedCategory = (cat: 'viral' | 'arrows' | 'faces') => {
    if (cat === 'viral') return t('emoji_dictionary.tab_viral');
    if (cat === 'arrows') return t('emoji_dictionary.tab_arrows');
    return t('emoji_dictionary.tab_faces');
  };

  return (
    <div className="w-full space-y-7" id="emoji-dictionary-workspace">
      
      {/* Intro descriptive header card */}
      <div className="p-5 bg-teal-55 dark:bg-emerald-955/10 border border-teal-100 dark:border-emerald-950/20 rounded-2xl flex gap-4 shadow-3xs items-start">
        <Smile className="w-6 h-6 text-teal-650 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-705 dark:text-slate-350 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('emoji_dictionary.title')}
          </h3>
          <p className="text-xs">
            {t('emoji_dictionary.desc')}
          </p>
          <p className="text-[10px] font-semibold text-teal-650 dark:text-teal-400 font-mono">
            💡 {isRtl 
              ? 'تصفية فورية وسريعة باللغتين العربية والإنجليزية. اختر ميزة "تجميع" لتركيب سلاسل كاملة ونسخها دفعة واحدة.'
              : 'Indexed local tags for instant Arabic/English querying. Switch to "Collection Bar" to assemble customized combinations.'}
          </p>
        </div>
      </div>

      {/* Main Panel Divider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* FILTERS & TARGET GRID (8 Column layout) */}
        <div className="lg:col-span-8 space-y-5">
          
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs">
            
            {/* Search inputs bar */}
            <div className="relative">
              <Search className={`absolute top-3.5 ${isRtl ? 'right-4' : 'left-4'} w-5 h-5 text-slate-400`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
                placeholder={t('emoji_dictionary.search_placeholder')}
                className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500`}
                id="emoji-search-field"
              />
            </div>

            {/* Tab Selection Filter System with responsive horizontal scrolling layout */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
              
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-2 text-xs font-bold rounded-lg shrink-0 transition flex items-center gap-1 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-850'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t('emoji_dictionary.tab_all')}</span>
              </button>

              <button
                onClick={() => setActiveTab('viral')}
                className={`px-3 py-2 text-xs font-bold rounded-lg shrink-0 transition flex items-center gap-1 cursor-pointer ${
                  activeTab === 'viral'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-850'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{t('emoji_dictionary.tab_viral')}</span>
              </button>

              <button
                onClick={() => setActiveTab('arrows')}
                className={`px-3 py-2 text-xs font-bold rounded-lg shrink-0 transition flex items-center gap-1 cursor-pointer ${
                  activeTab === 'arrows'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-850'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{t('emoji_dictionary.tab_arrows')}</span>
              </button>

              <button
                onClick={() => setActiveTab('faces')}
                className={`px-3 py-2 text-xs font-bold rounded-lg shrink-0 transition flex items-center gap-1 cursor-pointer ${
                  activeTab === 'faces'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-850'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>{t('emoji_dictionary.tab_faces')}</span>
              </button>

            </div>

          </div>

          {/* EMOJIS GRID */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl md:min-h-[380px] shadow-sm relative">
            
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-50 dark:border-slate-800 mb-4 text-xs font-bold text-slate-400 font-mono tracking-wider">
              <span>
                {isRtl ? `الرموز التعبيرية المطابقة (${filteredEmojis.length})` : `Matching Icons (${filteredEmojis.length})`}
              </span>
              <span>
                {copyMode === 'instant' ? '👆 ' + t('emoji_dictionary.mode_instant') : '📥 ' + t('emoji_dictionary.mode_accumulate')}
              </span>
            </div>

            {filteredEmojis.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3" id="emoji-elements-grid">
                {filteredEmojis.map((emoji, index) => (
                  <button
                    key={`${emoji.char}-${index}`}
                    onClick={() => handleEmojiClick(emoji.char)}
                    className="group relative p-3 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 duration-150 shadow-3xs cursor-pointer select-none"
                    title={isRtl ? `${emoji.nameAr} (${emoji.nameEn})` : `${emoji.nameEn} - Click to select/copy`}
                  >
                    {/* Giant emoji render */}
                    <span className="text-2xl filter drop-shadow-sm group-hover:scale-110 transition">{emoji.char}</span>
                    
                    {/* Micro subtext label hover details or status indications */}
                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 bg-teal-550 dark:bg-teal-600 rounded p-0.5 text-[8px] text-white font-bold transition">
                      {copyMode === 'instant' ? <Copy className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <Compass className="w-12 h-12 text-slate-350 animate-pulse" />
                <p className="text-slate-500 font-bold text-sm max-w-sm leading-relaxed">
                  {t('emoji_dictionary.no_results_found')}
                </p>
              </div>
            )}

          </div>

        </div>

        {/* WORKSPACE PRESET / ACCUMULATION WORKSPACE PANEL (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Output Mode Switcher Settings */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4.5 shadow-xs">
            
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Zap className="w-4 h-4 text-amber-500" />
              {isRtl ? 'وضع تفاعل الأزرار بالضغط' : 'Tactile Press Action Mode'}
            </h4>

            <div className="space-y-2">
              
              {/* Option Instant */}
              <button
                onClick={() => setCopyMode('instant')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  copyMode === 'instant'
                    ? 'border-teal-200 bg-teal-50/15 text-teal-900 dark:bg-teal-950/10 dark:text-teal-300 dark:border-teal-900/60'
                    : 'border-slate-100 hover:border-slate-200 text-slate-500 dark:border-slate-850'
                }`}
                id="mode-instant-copy"
              >
                <MousePointerClick className="w-4 h-4 text-teal-650 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">{t('emoji_dictionary.mode_instant')}</p>
                  <p className="text-[10px] text-slate-400">
                    {isRtl ? 'الضغط على أي إيموجي ينسخه مباشرة لحافظة جهازك.' : 'Clicking any emoji copies it directly to your system clipboard.'}
                  </p>
                </div>
              </button>

              {/* Option Accumulate / Shelf Bar */}
              <button
                onClick={() => setCopyMode('accumulate')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  copyMode === 'accumulate'
                    ? 'border-indigo-200 bg-indigo-50/15 text-indigo-900 dark:bg-indigo-950/10 dark:text-indigo-300 dark:border-indigo-900/60'
                    : 'border-slate-100 hover:border-slate-200 text-slate-500 dark:border-slate-850'
                }`}
                id="mode-accumulate-multi"
              >
                <Layers className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">{t('emoji_dictionary.mode_accumulate')}</p>
                  <p className="text-[10px] text-slate-400">
                    {isRtl ? 'التجميع المتتالي؛ تصطف الإيموجيات في شريط جانبي لتنسخها معاً.' : 'Consecutive collection; assembles custom sequences for a single batch copy.'}
                  </p>
                </div>
              </button>

            </div>

          </div>

          {/* COLLECTED ACCUMULATION FIELD (Shows only if we have collected items OR we are in accumulate mode to encourage them) */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-3 shadow-sm relative">
            
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-405 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-teal-500" />
                {t('emoji_dictionary.collected_bar_title')}
              </h4>
              
              {collectedEmojis.length > 0 && (
                <button
                  onClick={clearCollected}
                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition"
                  title={t('emoji_dictionary.clear_collected_btn')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Collected symbols line container */}
            <div className="min-h-[80px] p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 flex flex-wrap gap-2 items-center content-start">
              {collectedEmojis.length > 0 ? (
                collectedEmojis.map((emojiChar, idx) => (
                  <button
                    key={`${emojiChar}-col-${idx}`}
                    onClick={() => removeCollectedAt(idx)}
                    className="p-1.5 text-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-md hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer relative group flex items-center justify-center select-none"
                    title={isRtl ? 'انقر لحذف الرمز من المجموعة' : 'Click to delete from collection shelf'}
                  >
                    <span>{emojiChar}</span>
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full text-[7px] w-3 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      ×
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-slate-400 italic text-[11px] leading-relaxed select-text">
                  {copyMode === 'accumulate'
                    ? (isRtl ? 'اضغط على الرموز في الشبكة لتعبئة شريط التجميع وتعديل المحتوى...' : 'Click emojis from grid to accumulate a custom sequence here...')
                    : (isRtl ? 'ملاحظة: شريط التجميع خامل الآن. قم بتغيير وضع الضغط أعلاه لاستخدامه.' : 'Notice: Collector is inactive. Select Multi-Select mode above to start.')
                  }
                </p>
              )}
            </div>

            {/* Collected Copier Button */}
            {collectedEmojis.length > 0 && (
              <button
                onClick={handleCopyCollected}
                className="w-full py-2.5 px-3 bg-teal-550 hover:bg-teal-650 bg-teal-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>{t('emoji_dictionary.copy_collected_btn')}</span>
              </button>
            )}

            {/* Raw sequence helper to copy immediately */}
            {collectedEmojis.length > 0 && (
              <div className="p-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-orange-50/10 text-slate-500 text-[10.5px] font-mono select-all text-center">
                {collectedEmojis.join('')}
              </div>
            )}

          </div>

          {/* Creator Marketing Strategies Mini Alert */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex gap-3 shadow-3xs">
            <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
            <div className="text-[10.5px] text-slate-500 leading-relaxed select-text">
              <p className="font-bold text-slate-850 dark:text-white mb-0.5">
                {isRtl ? '💡 الحجم التفاعلي التعبيري' : 'Engagement Rates with Emojis'}
              </p>
              <p>
                {isRtl
                  ? 'تشير دراسات التسويق الرقمي إلى أن منشورات السوشيال ميديا التي تحتوي على الإيموجيات ترفع معدل التفاعل بنسبة تصل إلى ٤٨٪ مع سهولة قراءة العناصر.'
                  : 'Social channel data shows that posts using properly placed emojis see up to 48% higher engagement rates due to visual readability.'
                }
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Floating Bilingual Success Toasts */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {copiedNotification && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="py-2 px-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-extrabold rounded-full shadow-lg flex items-center gap-2 border border-slate-700/10 pointer-events-auto"
              id="copied-notification-toast"
            >
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{copiedNotification}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
