# 🎨 Sparkaph Design System - Glassmorphism Style

## 📱 Glassmorphism Buttons

### Primary Button (Glass)
```jsx
<button className="btn-glass-primary">
  Primary Action
</button>
```
**Использование:** Основные действия (Save, Send, Deploy)

### Secondary Button (Glass)
```jsx
<button className="btn-glass-secondary">
  Secondary Action
</button>
```
**Использование:** Второстепенные действия (Cancel, Back)

### Danger Button (Glass)
```jsx
<button className="btn-glass-danger">
  Delete
</button>
```
**Использование:** Опасные действия (Delete, Remove)

### Neutral Glass Button
```jsx
<button className="btn-glass">
  Neutral Action
</button>
```
**Использование:** Нейтральные действия

---

## 📝 Glass Inputs

### Text Input
```jsx
<input 
  type="text" 
  className="input w-full" 
  placeholder="Enter text..."
/>
```

### Textarea
```jsx
<textarea 
  className="textarea w-full" 
  placeholder="Enter description..."
/>
```

---

## 🎴 Glass Panels

### Glass Panel
```jsx
<div className="glass p-6 rounded-3xl">
  Content here
</div>
```
**Использование:** Модальные окна, карточки

### Strong Glass Panel
```jsx
<div className="glass-strong p-6 rounded-3xl">
  Important content
</div>
```
**Использование:** Основной контент, формы

### Card
```jsx
<div className="card p-6">
  Card content
</div>
```
**Использование:** Списки, элементы

---

## 🎨 iOS Colors

### System Colors
```css
--color-ios-blue: #007AFF
--color-ios-green: #34C759
--color-ios-indigo: #5856D6
--color-ios-orange: #FF9500
--color-ios-pink: #FF2D55
--color-ios-purple: #AF52DE
--color-ios-teal: #5AC8FA
--color-ios-yellow: #FFCC00
--color-ios-red: #FF3B30
```

### Usage
```jsx
<div className="bg-[var(--color-ios-blue)] text-white">
  Blue background
</div>
```

---

## 📐 Border Radius

```css
--radius-sm: 8px   /* Small elements */
--radius-md: 12px  /* Medium elements */
--radius-lg: 16px  /* Large elements */
--radius-xl: 20px  /* Extra large */
--radius-2xl: 24px /* Maximum */
```

### Usage
```jsx
<div className="rounded-[var(--radius-xl)]">
  Rounded content
</div>
```

---

## 🌓 Theme Support

### Light Theme
```jsx
<div data-theme="light">
  <!-- Light theme content -->
</div>
```

### Dark Theme
```jsx
<div data-theme="dark">
  <!-- Dark theme content -->
</div>
```

### Auto Colors
```jsx
<div className="bg-[var(--color-background)] text-[var(--color-text)]">
  Adapts to theme
</div>
```

---

## 📱 Responsive Design

### Mobile (< 640px)
- Меньшие border-radius
- Компактные кнопки (10px 20px)
- Font size 15-16px

### Tablet (641px - 1024px)
- Средние border-radius
- Стандартные кнопки

### Desktop (> 1025px)
- Большие border-radius
- Полные кнопки (12px 24px)

### Touch Devices
- Минимум 44x44px для кнопок
- Увеличенные области нажатия

---

## 🎭 Animations

### Hover Effects
```jsx
<button className="btn-glass-primary">
  <!-- Auto hover: translateY(-2px) + shadow -->
</button>
```

### Active Effects
```jsx
<button className="btn-glass-primary">
  <!-- Auto active: scale(0.98) -->
</button>
```

### Custom Animation
```jsx
<div className="animate-slide-in">
  Slides in from right
</div>
```

---

## 💡 Best Practices

### ✅ DO:
- Используй glass кнопки для всех действий
- Применяй правильные цвета (primary/secondary/danger)
- Используй адаптивные размеры
- Добавляй hover/active состояния

### ❌ DON'T:
- Не используй обычные кнопки
- Не смешивай разные стили
- Не забывай про accessibility
- Не игнорируй темную тему

---

## 🎯 Examples

### Form with Glass Inputs
```jsx
<div className="glass-strong p-8 rounded-3xl">
  <h2 className="text-2xl font-bold mb-6">Create Account</h2>
  
  <div className="space-y-4">
    <input 
      type="text" 
      className="input w-full" 
      placeholder="Username"
    />
    <input 
      type="email" 
      className="input w-full" 
      placeholder="Email"
    />
    <input 
      type="password" 
      className="input w-full" 
      placeholder="Password"
    />
  </div>
  
  <div className="flex gap-3 mt-6">
    <button className="btn-glass-secondary flex-1">
      Cancel
    </button>
    <button className="btn-glass-primary flex-1">
      Sign Up
    </button>
  </div>
</div>
```

### Modal with Glass Background
```jsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
  <div className="glass-strong p-8 rounded-3xl max-w-md w-full">
    <h3 className="text-xl font-bold mb-4">Confirm Action</h3>
    <p className="text-[var(--color-secondary-text)] mb-6">
      Are you sure you want to delete this item?
    </p>
    
    <div className="flex gap-3">
      <button className="btn-glass flex-1">
        Cancel
      </button>
      <button className="btn-glass-danger flex-1">
        Delete
      </button>
    </div>
  </div>
</div>
```

### Card List
```jsx
<div className="space-y-3">
  {items.map(item => (
    <div key={item.id} className="glass p-4 rounded-2xl hover:shadow-elevated transition-all">
      <h4 className="font-semibold">{item.title}</h4>
      <p className="text-sm text-[var(--color-secondary-text)] mt-1">
        {item.description}
      </p>
      
      <div className="flex gap-2 mt-3">
        <button className="btn-glass-secondary text-sm px-3 py-1">
          Edit
        </button>
        <button className="btn-glass-danger text-sm px-3 py-1">
          Delete
        </button>
      </div>
    </div>
  ))}
</div>
```

---

## 🚀 Quick Reference

| Element | Class | Usage |
|---------|-------|-------|
| Primary Button | `btn-glass-primary` | Main actions |
| Secondary Button | `btn-glass-secondary` | Cancel, back |
| Danger Button | `btn-glass-danger` | Delete, remove |
| Neutral Button | `btn-glass` | Other actions |
| Text Input | `input` | Form fields |
| Textarea | `textarea` | Long text |
| Glass Panel | `glass` | Containers |
| Strong Glass | `glass-strong` | Important content |
| Card | `card` | List items |

---

## 📞 Support

Questions about design system?
- 📧 Email: design@sparkaph.com
- 💬 Telegram: @sparkaph_design

---

**Создано для iOS 18 стиля с glassmorphism** 🎨✨
