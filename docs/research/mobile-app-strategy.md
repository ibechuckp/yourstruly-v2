# Mobile Native App Strategy for YoursTruly

*Research Date: February 25, 2026*

This document outlines a comprehensive strategy for converting YoursTruly into a native mobile application, covering framework selection, native features, and implementation details.

---

## Table of Contents

1. [Framework Comparison](#framework-comparison)
2. [Recommended Stack](#recommended-stack)
3. [Push Notifications](#push-notifications)
4. [Photo Gallery & Camera Access](#photo-gallery--camera-access)
5. [Contacts Integration](#contacts-integration)
6. [Share Extension](#share-extension)
7. [Home Screen Widgets](#home-screen-widgets)
8. [Background Sync & Offline Support](#background-sync--offline-support)
9. [Biometric Authentication](#biometric-authentication)
10. [Deep Linking & Universal Links](#deep-linking--universal-links)
11. [App Store Requirements](#app-store-requirements)
12. [Code Sharing Strategy](#code-sharing-strategy)
13. [Native Features to Leverage](#native-features-to-leverage)
14. [Implementation Roadmap](#implementation-roadmap)

---

## Framework Comparison

### React Native (Bare Workflow)

**Best for:** Maximum control, complex native integrations

| Aspect | Details |
|--------|---------|
| Language | TypeScript/JavaScript + native (Swift/Kotlin) |
| Performance | Near-native, 60fps animations |
| Native Access | Full access via native modules |
| Learning Curve | Moderate (if familiar with React) |
| Community | Massive, Meta-backed |
| Hot Reload | Yes |

**Pros:**
- Largest ecosystem of libraries
- Full control over native code
- Strong TypeScript support
- Can share logic with Next.js web app
- Battle-tested at scale (Facebook, Instagram, Discord)

**Cons:**
- More setup complexity
- Need Xcode/Android Studio for native modules
- Larger app size than pure native
- Bridge overhead for complex operations

---

### Expo (Managed + Custom Dev Client)

**Best for:** Rapid development with native capabilities

| Aspect | Details |
|--------|---------|
| Language | TypeScript/JavaScript |
| Performance | Near-native (EAS Build uses native) |
| Native Access | Via Expo modules + config plugins |
| Learning Curve | Low |
| OTA Updates | Yes (EAS Update) |
| Hot Reload | Yes |

**Pros:**
- Fastest development cycle
- OTA updates without app store review
- Excellent documentation
- EAS Build handles CI/CD
- Most native features available via plugins
- Config plugins for custom native code
- Single codebase deploys everywhere

**Cons:**
- Slightly larger app size
- Some limitations on native customization
- EAS Build costs ($29+/month for teams)

---

### Flutter

**Best for:** Custom UI design, consistent look across platforms

| Aspect | Details |
|--------|---------|
| Language | Dart |
| Performance | Compiled to native, very fast |
| Native Access | Platform channels |
| Learning Curve | Moderate (new language) |
| Community | Growing rapidly, Google-backed |
| Hot Reload | Yes (fastest) |

**Pros:**
- Best-in-class hot reload
- Consistent UI across platforms
- Excellent performance
- Material 3 and Cupertino widgets
- Strong typing with Dart

**Cons:**
- Cannot share code with Next.js web app
- Dart learning curve
- Smaller library ecosystem than React Native
- iOS widgets still require SwiftUI

---

### Capacitor (Ionic)

**Best for:** Wrapping existing web app quickly

| Aspect | Details |
|--------|---------|
| Language | Any web framework |
| Performance | Web-based (WebView) |
| Native Access | Via Capacitor plugins |
| Learning Curve | Very low |
| Web Code Reuse | 100% |

**Pros:**
- Wrap existing Next.js app directly
- Lowest development effort
- Full web code reuse
- Easy native plugin integration

**Cons:**
- WebView performance limitations
- Not truly native feel
- Complex gestures can feel sluggish
- Users can tell it's a wrapped web app

---

## Recommended Stack

### **Primary Recommendation: Expo with Custom Dev Client**

For YoursTruly, Expo provides the best balance of development speed, native capabilities, and code sharing with the web app.

```
┌─────────────────────────────────────────────────────────────┐
│                    Shared Code (80%)                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Business Logic (TypeScript)                          ││
│  │  • API Client / Supabase SDK                            ││
│  │  • State Management (Zustand/Jotai)                     ││
│  │  • Validation (Zod)                                      ││
│  │  • Utils, Hooks, Types                                   ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│         Web (Next.js)        │      Mobile (Expo)           │
│  ┌────────────────────────┐  │  ┌─────────────────────────┐ │
│  │  React DOM Components   │  │  │  React Native Components│ │
│  │  next/image             │  │  │  expo-image             │ │
│  │  next/router            │  │  │  expo-router            │ │
│  │  Tailwind CSS           │  │  │  NativeWind             │ │
│  │  Server Components      │  │  │  Native UI              │ │
│  └────────────────────────┘  │  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
yourstruly/
├── apps/
│   ├── web/                    # Next.js app
│   │   ├── app/
│   │   ├── components/
│   │   └── package.json
│   │
│   └── mobile/                 # Expo app
│       ├── app/                # expo-router
│       ├── components/
│       ├── ios/                # Native iOS code
│       ├── android/            # Native Android code
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared business logic
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   └── package.json
│   │
│   ├── ui/                     # Shared UI primitives
│   │   ├── Button/
│   │   ├── Input/
│   │   └── package.json
│   │
│   └── config/                 # Shared config
│       ├── eslint/
│       ├── tsconfig/
│       └── package.json
│
├── package.json                # Workspace root
├── turbo.json                  # Turborepo config
└── pnpm-workspace.yaml
```

---

## Push Notifications

### Implementation with Expo Notifications

```typescript
// packages/shared/notifications/setup.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../api/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Get Expo push token
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID,
  });

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
    });

    await Notifications.setNotificationChannelAsync('memories', {
      name: 'Memory Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Notifications for memory anniversaries and reminders',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages from Loved Ones',
      importance: Notifications.AndroidImportance.MAX,
      description: 'Time-capsule messages that have been unlocked',
    });
  }

  // Store token in Supabase
  await supabase
    .from('user_devices')
    .upsert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      push_token: token.data,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    });

  return token.data;
}
```

### Notification Types for YoursTruly

```typescript
// packages/shared/notifications/types.ts
export type NotificationType =
  | 'memory_anniversary'      // "1 year ago you captured this moment..."
  | 'time_capsule_unlock'     // "A message from [name] has been unlocked"
  | 'circle_activity'         // "Your family circle has new activity"
  | 'prompt_reminder'         // "Time to capture today's moment"
  | 'tribute_comment'         // "Someone commented on your tribute"
  | 'gift_delivered'          // "Your scheduled gift has been delivered"
  | 'engagement_nudge';       // "Your digital legacy is 75% complete"

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    memoryId?: string;
    circleId?: string;
    tributeId?: string;
    deepLink?: string;
  };
}
```

### Backend Integration (Supabase Edge Function)

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { userId, notification } = await req.json();

  // Get user's push tokens
  const { data: devices } = await supabaseAdmin
    .from('user_devices')
    .select('push_token, platform')
    .eq('user_id', userId);

  if (!devices?.length) return new Response('No devices');

  // Send via Expo's push service
  const messages = devices.map((device) => ({
    to: device.push_token,
    sound: 'default',
    title: notification.title,
    body: notification.body,
    data: notification.data,
    categoryId: notification.type,
    badge: 1,
  }));

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify(messages),
  });

  return new Response('Sent');
});
```

---

## Photo Gallery & Camera Access

### Expo Image Picker Implementation

```typescript
// apps/mobile/components/MediaCapture.tsx
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Camera } from 'expo-camera';
import { useState } from 'react';
import { uploadToSupabase } from '@yourstruly/shared/api';

interface MediaAsset {
  uri: string;
  type: 'image' | 'video';
  width: number;
  height: number;
  duration?: number;
}

export function useMediaCapture() {
  const [uploading, setUploading] = useState(false);

  // Request permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
    
    return cameraStatus === 'granted' && mediaStatus === 'granted';
  };

  // Pick from gallery (multiple selection)
  const pickFromGallery = async (options?: {
    mediaTypes?: ImagePicker.MediaTypeOptions;
    allowsMultipleSelection?: boolean;
    selectionLimit?: number;
  }): Promise<MediaAsset[]> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: options?.mediaTypes ?? ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: options?.allowsMultipleSelection ?? true,
      selectionLimit: options?.selectionLimit ?? 10,
      quality: 0.8,
      exif: true,
      videoMaxDuration: 60,
    });

    if (result.canceled) return [];

    return result.assets.map((asset) => ({
      uri: asset.uri,
      type: asset.type === 'video' ? 'video' : 'image',
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
    }));
  };

  // Capture with camera
  const captureWithCamera = async (
    type: 'photo' | 'video' = 'photo'
  ): Promise<MediaAsset | null> => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes:
        type === 'video'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      videoMaxDuration: 60,
      exif: true,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      type: asset.type === 'video' ? 'video' : 'image',
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
    };
  };

  // Upload to Supabase with progress
  const uploadMedia = async (
    assets: MediaAsset[],
    onProgress?: (progress: number) => void
  ) => {
    setUploading(true);
    const results = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const result = await uploadToSupabase(asset.uri, {
        bucket: 'memories',
        contentType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
      });
      results.push(result);
      onProgress?.(((i + 1) / assets.length) * 100);
    }

    setUploading(false);
    return results;
  };

  return {
    requestPermissions,
    pickFromGallery,
    captureWithCamera,
    uploadMedia,
    uploading,
  };
}
```

### Custom Camera Screen

```typescript
// apps/mobile/app/camera.tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const scale = useSharedValue(1);

  const capturePhoto = async () => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate button
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1);
    });

    const photo = await cameraRef.current?.takePictureAsync({
      quality: 0.8,
      exif: true,
      skipProcessing: false,
    });

    if (photo) {
      // Navigate to preview/edit screen
      router.push({
        pathname: '/memory/new',
        params: { uri: photo.uri },
      });
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const video = await cameraRef.current?.recordAsync({
      maxDuration: 60,
    });

    if (video) {
      router.push({
        pathname: '/memory/new',
        params: { uri: video.uri, type: 'video' },
      });
    }
    setIsRecording(false);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!permission?.granted) {
    return <PermissionRequest onRequest={requestPermission} />;
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="picture"
      >
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          >
            <FlipIcon />
          </TouchableOpacity>

          <Animated.View style={animatedStyle}>
            <TouchableOpacity
              style={[styles.captureButton, isRecording && styles.recording]}
              onPress={capturePhoto}
              onLongPress={startRecording}
              delayLongPress={500}
            />
          </Animated.View>

          <TouchableOpacity
            style={styles.galleryButton}
            onPress={() => router.push('/gallery')}
          >
            <GalleryIcon />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}
```

---

## Contacts Integration

### Expo Contacts Implementation

```typescript
// apps/mobile/hooks/useContacts.ts
import * as Contacts from 'expo-contacts';
import { useState, useEffect } from 'react';

interface Contact {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  phoneNumbers?: string[];
  emails?: string[];
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  const fetchContacts = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Image,
      ],
      sort: Contacts.SortTypes.FirstName,
    });

    setContacts(
      data.map((c) => ({
        id: c.id,
        name: c.name || `${c.firstName} ${c.lastName}`,
        firstName: c.firstName,
        lastName: c.lastName,
        image: c.image?.uri,
        phoneNumbers: c.phoneNumbers?.map((p) => p.number!),
        emails: c.emails?.map((e) => e.email!),
      }))
    );
  };

  const searchContacts = async (query: string): Promise<Contact[]> => {
    const { data } = await Contacts.getContactsAsync({
      name: query,
      fields: [
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.Image,
      ],
    });

    return data.map((c) => ({
      id: c.id,
      name: c.name || `${c.firstName} ${c.lastName}`,
      image: c.image?.uri,
    }));
  };

  return {
    contacts,
    hasPermission,
    requestPermission,
    fetchContacts,
    searchContacts,
  };
}
```

### People/Circles Integration

```typescript
// apps/mobile/components/AddToCircle.tsx
import { useContacts } from '../hooks/useContacts';
import { supabase } from '@yourstruly/shared/api';

export function AddToCircleSheet({ circleId }: { circleId: string }) {
  const { contacts, searchContacts } = useContacts();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState(contacts);

  useEffect(() => {
    if (search) {
      searchContacts(search).then(setResults);
    } else {
      setResults(contacts);
    }
  }, [search]);

  const inviteContact = async (contact: Contact) => {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.in.(${contact.emails?.join(',')}),phone.in.(${contact.phoneNumbers?.join(',')})`)
      .single();

    if (existingUser) {
      // Add to circle directly
      await supabase.from('circle_members').insert({
        circle_id: circleId,
        user_id: existingUser.id,
        status: 'pending',
      });
    } else {
      // Send invitation
      await supabase.functions.invoke('send-circle-invite', {
        body: {
          circleId,
          contactName: contact.name,
          email: contact.emails?.[0],
          phone: contact.phoneNumbers?.[0],
        },
      });
    }
  };

  return (
    <BottomSheet>
      <SearchInput value={search} onChangeText={setSearch} />
      <FlashList
        data={results}
        renderItem={({ item }) => (
          <ContactRow contact={item} onPress={() => inviteContact(item)} />
        )}
        estimatedItemSize={60}
      />
    </BottomSheet>
  );
}
```

---

## Share Extension

### iOS Share Extension Setup

The Share Extension allows users to share photos TO YoursTruly from the Photos app or any other app.

```swift
// ios/ShareExtension/ShareViewController.swift
import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

class ShareViewController: SLComposeServiceViewController {
    
    private var selectedImages: [UIImage] = []
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Configure appearance
        navigationController?.navigationBar.tintColor = .white
        navigationController?.navigationBar.backgroundColor = UIColor(named: "Primary")
    }
    
    override func isContentValid() -> Bool {
        return !selectedImages.isEmpty
    }
    
    override func didSelectPost() {
        // Process shared content
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments else {
            extensionContext?.completeRequest(returningItems: nil)
            return
        }
        
        let group = DispatchGroup()
        
        for attachment in attachments {
            if attachment.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                group.enter()
                attachment.loadItem(forTypeIdentifier: UTType.image.identifier) { [weak self] data, error in
                    defer { group.leave() }
                    
                    if let url = data as? URL,
                       let imageData = try? Data(contentsOf: url),
                       let image = UIImage(data: imageData) {
                        self?.selectedImages.append(image)
                    } else if let image = data as? UIImage {
                        self?.selectedImages.append(image)
                    }
                }
            }
        }
        
        group.notify(queue: .main) { [weak self] in
            self?.saveToAppGroup()
            self?.openMainApp()
        }
    }
    
    private func saveToAppGroup() {
        // Save to shared App Group container
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: "group.com.yourstruly.app"
        ) else { return }
        
        let sharedURL = containerURL.appendingPathComponent("shared_media")
        try? FileManager.default.createDirectory(at: sharedURL, withIntermediateDirectories: true)
        
        for (index, image) in selectedImages.enumerated() {
            let fileURL = sharedURL.appendingPathComponent("shared_\(index).jpg")
            try? image.jpegData(compressionQuality: 0.8)?.write(to: fileURL)
        }
        
        // Store caption
        let caption = contentText ?? ""
        UserDefaults(suiteName: "group.com.yourstruly.app")?.set(caption, forKey: "shared_caption")
        UserDefaults(suiteName: "group.com.yourstruly.app")?.set(selectedImages.count, forKey: "shared_count")
    }
    
    private func openMainApp() {
        // Open main app via URL scheme
        let url = URL(string: "yourstruly://share-extension")!
        
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url)
                break
            }
            responder = responder?.next
        }
        
        extensionContext?.completeRequest(returningItems: nil)
    }
}
```

### React Native Share Extension Handler

```typescript
// apps/mobile/app/share-extension.tsx
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';

export default function ShareExtensionScreen() {
  const [sharedMedia, setSharedMedia] = useState<string[]>([]);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    loadSharedMedia();
  }, []);

  const loadSharedMedia = async () => {
    if (Platform.OS === 'ios') {
      // Read from App Group
      const groupPath = `${FileSystem.documentDirectory}../../group.com.yourstruly.app/shared_media/`;
      
      // This requires native module to read from App Group
      // Using expo-file-system with app group access
      const files = await FileSystem.readDirectoryAsync(groupPath);
      const mediaFiles = files
        .filter(f => f.startsWith('shared_'))
        .map(f => `${groupPath}${f}`);
      
      setSharedMedia(mediaFiles);
      
      // Read caption from UserDefaults (via native module)
      const savedCaption = await getAppGroupValue('shared_caption');
      setCaption(savedCaption || '');
    }
  };

  const handleCreate = async () => {
    // Navigate to memory creation with pre-filled media
    router.push({
      pathname: '/memory/new',
      params: {
        sharedMedia: JSON.stringify(sharedMedia),
        caption,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Memory</Text>
      
      <ScrollView horizontal>
        {sharedMedia.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.thumbnail} />
        ))}
      </ScrollView>
      
      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="Add a caption..."
        multiline
        style={styles.input}
      />
      
      <Button title="Create Memory" onPress={handleCreate} />
    </View>
  );
}
```

### Android Share Intent

```kotlin
// android/app/src/main/java/com/yourstruly/ShareActivity.kt
package com.yourstruly.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class ShareActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        when (intent?.action) {
            Intent.ACTION_SEND -> {
                handleSingleShare(intent)
            }
            Intent.ACTION_SEND_MULTIPLE -> {
                handleMultipleShare(intent)
            }
        }
    }
    
    private fun handleSingleShare(intent: Intent) {
        val imageUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
        val text = intent.getStringExtra(Intent.EXTRA_TEXT)
        
        imageUri?.let {
            openAppWithMedia(listOf(it), text)
        }
    }
    
    private fun handleMultipleShare(intent: Intent) {
        val imageUris = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
        val text = intent.getStringExtra(Intent.EXTRA_TEXT)
        
        imageUris?.let {
            openAppWithMedia(it, text)
        }
    }
    
    private fun openAppWithMedia(uris: List<Uri>, caption: String?) {
        // Store in shared preferences
        val prefs = getSharedPreferences("share_data", MODE_PRIVATE)
        prefs.edit()
            .putStringSet("shared_uris", uris.map { it.toString() }.toSet())
            .putString("shared_caption", caption)
            .apply()
        
        // Launch main app
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("from_share", true)
        }
        startActivity(launchIntent)
        finish()
    }
}
```

---

## Home Screen Widgets

### iOS Widget with WidgetKit

Widgets require native SwiftUI code, even in Expo apps.

```swift
// ios/YoursTrulyWidgets/MemoryWidget.swift
import WidgetKit
import SwiftUI

struct MemoryEntry: TimelineEntry {
    let date: Date
    let memory: Memory?
    
    struct Memory {
        let id: String
        let imageURL: String
        let caption: String
        let dateString: String
    }
}

struct MemoryProvider: TimelineProvider {
    func placeholder(in context: Context) -> MemoryEntry {
        MemoryEntry(date: Date(), memory: nil)
    }
    
    func getSnapshot(in context: Context, completion: @escaping (MemoryEntry) -> Void) {
        let entry = loadLatestMemory()
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<MemoryEntry>) -> Void) {
        let entry = loadLatestMemory()
        
        // Refresh every hour
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func loadLatestMemory() -> MemoryEntry {
        // Read from App Group shared container
        guard let defaults = UserDefaults(suiteName: "group.com.yourstruly.app"),
              let memoryData = defaults.data(forKey: "widget_memory"),
              let memory = try? JSONDecoder().decode(WidgetMemory.self, from: memoryData) else {
            return MemoryEntry(date: Date(), memory: nil)
        }
        
        return MemoryEntry(
            date: Date(),
            memory: MemoryEntry.Memory(
                id: memory.id,
                imageURL: memory.imageURL,
                caption: memory.caption,
                dateString: memory.dateString
            )
        )
    }
}

struct MemoryWidgetView: View {
    var entry: MemoryEntry
    
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        ZStack {
            if let memory = entry.memory {
                AsyncImage(url: URL(string: memory.imageURL)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Color.gray
                }
                
                VStack {
                    Spacer()
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(memory.caption)
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(.white)
                                .lineLimit(2)
                            
                            Text(memory.dateString)
                                .font(.caption2)
                                .foregroundColor(.white.opacity(0.8))
                        }
                        Spacer()
                    }
                    .padding(12)
                    .background(.ultraThinMaterial)
                }
            } else {
                VStack {
                    Image(systemName: "photo.on.rectangle")
                        .font(.largeTitle)
                        .foregroundColor(.gray)
                    Text("No memories yet")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
        }
        .widgetURL(URL(string: "yourstruly://memory/\(entry.memory?.id ?? "")"))
    }
}

@main
struct YoursTrulyWidgets: WidgetBundle {
    var body: some Widget {
        MemoryWidget()
        EngagementWidget()
    }
}

struct MemoryWidget: Widget {
    let kind: String = "MemoryWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MemoryProvider()) { entry in
            MemoryWidgetView(entry: entry)
        }
        .configurationDisplayName("Memory of the Day")
        .description("See a random memory from your collection")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
```

### Updating Widget from React Native

```typescript
// apps/mobile/utils/updateWidget.ts
import { NativeModules, Platform } from 'react-native';

const { WidgetBridge } = NativeModules;

interface WidgetMemory {
  id: string;
  imageURL: string;
  caption: string;
  dateString: string;
}

export async function updateMemoryWidget(memory: WidgetMemory) {
  if (Platform.OS === 'ios') {
    // Update via native module
    WidgetBridge?.updateMemoryWidget(JSON.stringify(memory));
  } else if (Platform.OS === 'android') {
    // Update Android widget via SharedPreferences + broadcast
    WidgetBridge?.updateWidget('memory', JSON.stringify(memory));
  }
}

export async function refreshAllWidgets() {
  if (Platform.OS === 'ios') {
    WidgetBridge?.reloadAllTimelines();
  } else {
    WidgetBridge?.refreshWidgets();
  }
}
```

### Native Module for Widget Communication

```swift
// ios/YoursTrulyWidgets/WidgetBridge.swift
import Foundation
import WidgetKit

@objc(WidgetBridge)
class WidgetBridge: NSObject {
    
    @objc
    func updateMemoryWidget(_ jsonString: String) {
        guard let data = jsonString.data(using: .utf8),
              let defaults = UserDefaults(suiteName: "group.com.yourstruly.app") else {
            return
        }
        
        defaults.set(data, forKey: "widget_memory")
        
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadTimelines(ofKind: "MemoryWidget")
        }
    }
    
    @objc
    func reloadAllTimelines() {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
```

---

## Background Sync & Offline Support

### Expo Background Fetch

```typescript
// apps/mobile/tasks/backgroundSync.ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncPendingUploads, fetchNewContent } from '@yourstruly/shared/sync';

const BACKGROUND_SYNC_TASK = 'yourstruly-background-sync';

// Define the task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Sync pending uploads
    const pendingUploads = await AsyncStorage.getItem('pending_uploads');
    if (pendingUploads) {
      const uploads = JSON.parse(pendingUploads);
      await syncPendingUploads(uploads);
      await AsyncStorage.removeItem('pending_uploads');
    }

    // Fetch new content
    await fetchNewContent();

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background sync failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the task
export async function registerBackgroundSync() {
  const status = await BackgroundFetch.getStatusAsync();
  
  if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}
```

### Offline-First Data Layer

```typescript
// packages/shared/offline/store.ts
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

const asyncStoragePersister = createSyncStoragePersister({
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
    removeItem: AsyncStorage.removeItem,
  },
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
});
```

### Optimistic Updates

```typescript
// packages/shared/hooks/useCreateMemory.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMemory } from '../api/memories';

export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMemory,
    onMutate: async (newMemory) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['memories'] });

      // Snapshot the previous value
      const previousMemories = queryClient.getQueryData(['memories']);

      // Optimistically update
      queryClient.setQueryData(['memories'], (old: Memory[]) => [
        {
          ...newMemory,
          id: `temp-${Date.now()}`,
          synced: false,
          createdAt: new Date().toISOString(),
        },
        ...old,
      ]);

      return { previousMemories };
    },
    onError: (err, newMemory, context) => {
      // Rollback on error
      queryClient.setQueryData(['memories'], context?.previousMemories);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
```

---

## Biometric Authentication

### Implementation with Expo LocalAuthentication

```typescript
// apps/mobile/auth/biometrics.ts
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export async function isBiometricsAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function getBiometricType(): Promise<'face' | 'fingerprint' | 'none'> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'face';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  return 'none';
}

export async function authenticateWithBiometrics(
  reason: string = 'Authenticate to access YoursTruly'
): Promise<BiometricAuthResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use passcode',
    });

    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Secure session token storage
export async function storeSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('session_token', token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync('session_token');
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync('session_token');
}
```

### Protected App Component

```typescript
// apps/mobile/components/BiometricGate.tsx
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';
import {
  authenticateWithBiometrics,
  isBiometricsAvailable,
} from '../auth/biometrics';
import { useAuth } from '@yourstruly/shared/auth';

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { settings } = useAuth();

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (state: AppStateStatus) => {
    if (state === 'active' && isLocked && settings.biometricsEnabled) {
      await authenticate();
    } else if (state === 'background' && settings.biometricsEnabled) {
      setIsLocked(true);
    }
  };

  const authenticate = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    const available = await isBiometricsAvailable();
    
    if (!available) {
      setIsLocked(false);
      setIsAuthenticating(false);
      return;
    }

    const result = await authenticateWithBiometrics(
      'Unlock YoursTruly to access your memories'
    );
    
    if (result.success) {
      setIsLocked(false);
    }
    setIsAuthenticating(false);
  };

  if (isLocked) {
    return (
      <View style={styles.lockScreen}>
        <LockIcon />
        <Text>Tap to unlock</Text>
        <TouchableOpacity onPress={authenticate}>
          <Text>Use Face ID</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}
```

---

## Deep Linking & Universal Links

### Expo Router Deep Links

```typescript
// apps/mobile/app.json (partial)
{
  "expo": {
    "scheme": "yourstruly",
    "ios": {
      "bundleIdentifier": "com.yourstruly.app",
      "associatedDomains": [
        "applinks:yourstruly.love",
        "webcredentials:yourstruly.love"
      ]
    },
    "android": {
      "package": "com.yourstruly.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "yourstruly.love",
              "pathPrefix": "/memory"
            },
            {
              "scheme": "https",
              "host": "yourstruly.love",
              "pathPrefix": "/circle"
            },
            {
              "scheme": "https",
              "host": "yourstruly.love",
              "pathPrefix": "/invite"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Route Structure

```typescript
// apps/mobile/app/_layout.tsx
import { Stack } from 'expo-router';
import { useURL } from 'expo-linking';

export default function RootLayout() {
  const url = useURL();

  useEffect(() => {
    if (url) {
      handleDeepLink(url);
    }
  }, [url]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="memory/[id]" options={{ title: 'Memory' }} />
      <Stack.Screen name="circle/[id]" options={{ title: 'Circle' }} />
      <Stack.Screen name="invite/[code]" options={{ title: 'Invitation' }} />
      <Stack.Screen name="share-extension" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

### Apple App Site Association

```json
// public/.well-known/apple-app-site-association
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.yourstruly.app",
        "paths": [
          "/memory/*",
          "/circle/*",
          "/invite/*",
          "/tribute/*"
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAMID.com.yourstruly.app"]
  }
}
```

### Android Asset Links

```json
// public/.well-known/assetlinks.json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.yourstruly.app",
      "sha256_cert_fingerprints": [
        "SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

---

## App Store Requirements

### iOS App Store

| Requirement | Details |
|-------------|---------|
| **App Icon** | 1024x1024px (no alpha) |
| **Screenshots** | 6.7", 6.5", 5.5" iPhone + 12.9" iPad |
| **Privacy Policy** | Required URL |
| **Privacy Nutrition Labels** | Data types collected, linked to user |
| **Age Rating** | 4+ (no objectionable content) |
| **App Review Guidelines** | 4.2.2 (Photos access justification) |
| **In-App Purchases** | Use StoreKit 2 for subscriptions |
| **Sign in with Apple** | Required if other social sign-in offered |

### iOS Info.plist Permissions

```xml
<key>NSCameraUsageDescription</key>
<string>YoursTruly needs camera access to capture memories and record video messages.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>YoursTruly needs photo access to let you add existing photos to your memories.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>YoursTruly needs to save captured photos and videos to your library.</string>

<key>NSMicrophoneUsageDescription</key>
<string>YoursTruly needs microphone access to record audio messages and video.</string>

<key>NSContactsUsageDescription</key>
<string>YoursTruly uses your contacts to help you invite family and friends to your circles.</string>

<key>NSFaceIDUsageDescription</key>
<string>YoursTruly uses Face ID to securely unlock the app and protect your memories.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>YoursTruly can add location to your memories if you choose.</string>
```

### Google Play Store

| Requirement | Details |
|-------------|---------|
| **App Icon** | 512x512px |
| **Feature Graphic** | 1024x500px |
| **Screenshots** | Phone + 7" tablet + 10" tablet |
| **Privacy Policy** | Required URL |
| **Data Safety** | Data types collected, shared, security practices |
| **Target API Level** | 34+ (Android 14) required |
| **Permissions Declaration** | Justify each permission in form |
| **Content Rating** | IARC questionnaire |

---

## Code Sharing Strategy

### Shared Packages

```typescript
// packages/shared/index.ts
// Re-export everything that can be shared

// API & Data
export * from './api/supabase';
export * from './api/memories';
export * from './api/circles';
export * from './api/tributes';

// State Management
export * from './stores/auth';
export * from './stores/user';
export * from './stores/memories';

// Hooks
export * from './hooks/useAuth';
export * from './hooks/useMemories';
export * from './hooks/useCircles';

// Types
export * from './types';

// Utils
export * from './utils/date';
export * from './utils/format';
export * from './utils/validation';

// Constants
export * from './constants';
```

### Platform-Specific Implementations

```typescript
// packages/shared/storage/index.ts
import { Platform } from 'react-native';

// Conditional export based on platform
export const storage = Platform.select({
  web: () => require('./web').webStorage,
  default: () => require('./native').nativeStorage,
})();
```

```typescript
// packages/shared/storage/native.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const nativeStorage = {
  getItem: AsyncStorage.getItem,
  setItem: AsyncStorage.setItem,
  removeItem: AsyncStorage.removeItem,
};
```

```typescript
// packages/shared/storage/web.ts
export const webStorage = {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
};
```

### Sharing Percentage Breakdown

| Layer | Shared | Platform-Specific |
|-------|--------|-------------------|
| Business Logic | 95% | 5% (platform APIs) |
| API Client | 100% | 0% |
| State Management | 100% | 0% |
| Types/Interfaces | 100% | 0% |
| Validation | 100% | 0% |
| UI Components | 30% | 70% (native components) |
| Navigation | 20% | 80% (expo-router vs next/router) |
| **Overall** | **~70%** | **~30%** |

---

## Native Features to Leverage

### 1. Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics';

// Success action (saving memory)
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Selection feedback
await Haptics.selectionAsync();

// Button press
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

### 2. Local Notifications (Scheduled)

```typescript
import * as Notifications from 'expo-notifications';

// Memory anniversary reminder
await Notifications.scheduleNotificationAsync({
  content: {
    title: '1 Year Ago Today',
    body: 'You captured this beautiful moment...',
    data: { memoryId: 'abc123' },
  },
  trigger: {
    date: anniversaryDate,
    channelId: 'memories',
  },
});
```

### 3. Health Data (HealthKit / Health Connect)

```typescript
// For wellness-related memories
import { Health } from 'expo-health';

// Request permissions
await Health.requestPermissionsAsync([
  Health.HealthKitDataType.StepCount,
  Health.HealthKitDataType.HeartRate,
]);

// Add context to memories
const steps = await Health.getStepCountAsync(memoryDate);
```

### 4. Location Services

```typescript
import * as Location from 'expo-location';

// Geotagging memories
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Balanced,
});

// Reverse geocode for display
const [place] = await Location.reverseGeocodeAsync(location.coords);
const locationString = `${place.city}, ${place.country}`;
```

### 5. Media Processing

```typescript
import { Video } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Generate video thumbnail
const { uri: thumbnail } = await VideoThumbnails.getThumbnailAsync(videoUri, {
  time: 1000,
  quality: 0.8,
});

// Compress/resize image
const result = await manipulateAsync(
  imageUri,
  [{ resize: { width: 1920 } }],
  { compress: 0.8, format: SaveFormat.JPEG }
);
```

### 6. Document Scanner

```typescript
import { DocumentScanner } from 'expo-camera';

// Scan documents/letters to add to tributes
const result = await DocumentScanner.scanDocumentAsync({
  quality: 0.8,
  detectText: true,
});
```

### 7. Voice Recording

```typescript
import { Audio } from 'expo-av';

// Record audio messages
const recording = new Audio.Recording();
await recording.prepareToRecordAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY
);
await recording.startAsync();

// Later...
await recording.stopAndUnloadAsync();
const uri = recording.getURI();
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)

**Goal:** Basic mobile app with core functionality

- [ ] Set up Expo monorepo with shared packages
- [ ] Implement authentication (Supabase + biometrics)
- [ ] Create memory list view
- [ ] Implement image picker & camera
- [ ] Basic memory creation flow
- [ ] Push notification setup
- [ ] Deep linking configuration

**Deliverables:**
- TestFlight/Internal testing build
- Core user flows working

### Phase 2: Native Features (Weeks 4-6)

**Goal:** Native capabilities that differentiate from web

- [ ] Share extension (iOS + Android)
- [ ] Offline support with background sync
- [ ] Haptic feedback throughout
- [ ] Local notifications (memory anniversaries)
- [ ] Video recording and playback
- [ ] Photo multi-select from gallery

**Deliverables:**
- Feature-complete beta build
- Native share working

### Phase 3: Widgets & Polish (Weeks 7-8)

**Goal:** Engagement features + polish

- [ ] iOS home screen widgets (3 sizes)
- [ ] Android home screen widgets
- [ ] App Clips / Instant Apps (invitation flow)
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Crash-free rate optimization

**Deliverables:**
- Production-ready build
- Widget variations complete

### Phase 4: Launch Prep (Weeks 9-10)

**Goal:** App store submission

- [ ] App store screenshots
- [ ] App store descriptions
- [ ] Privacy policy updates
- [ ] Data safety declarations
- [ ] TestFlight public beta
- [ ] App review submission
- [ ] Marketing materials

**Deliverables:**
- App store approval
- Launch day coordination

---

## Cost Estimates

### Development Tools

| Service | Cost |
|---------|------|
| Apple Developer Program | $99/year |
| Google Play Console | $25 one-time |
| Expo EAS (Team) | $99/month |
| Sentry (Error tracking) | Free tier |
| **Total First Year** | **~$1,300** |

### Ongoing Costs

| Service | Monthly |
|---------|---------|
| EAS Build | $99 |
| Push notifications (Expo) | Included |
| Code signing | Included |
| App store fees | 15-30% of IAP |
| **Total Monthly** | **~$100** |

---

## Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS widget limitations | Medium | Design widget-first, test on device early |
| Share extension complexity | High | Start with iOS only, add Android later |
| Background sync reliability | Medium | Use multiple strategies (fetch + push) |
| App store rejection | High | Follow guidelines strictly, test with TestFlight |
| Performance on low-end Android | Medium | Test on $100 phones, optimize aggressively |
| Offline sync conflicts | Medium | Implement conflict resolution UI |

---

## Next Steps

1. **Immediate**: Create Expo project in monorepo
2. **This week**: Implement shared packages structure
3. **Next week**: Authentication + basic memory CRUD
4. **Week 3**: Camera/gallery integration
5. **Week 4**: Share extension (iOS first)
6. **Month 2**: Widgets + polish
7. **Month 3**: App store launch

---

*Document Version: 1.0*
*Last Updated: February 25, 2026*
