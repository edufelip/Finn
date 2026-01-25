# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ============================================================================
# React Native Core
# ============================================================================

# Keep React Native classes
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}

-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep JavaScript interface for WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ============================================================================
# React Native Reanimated
# ============================================================================

-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.swmansion.common.** { *; }

# ============================================================================
# React Native Gesture Handler
# ============================================================================

-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.facebook.react.bridge.** { *; }

# ============================================================================
# React Native Screens
# ============================================================================

-keep class com.swmansion.rnscreens.** { *; }

# ============================================================================
# Hermes Engine
# ============================================================================

-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }

# ============================================================================
# Expo Modules
# ============================================================================

# Expo core
-keep class expo.modules.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Expo notifications
-keep class expo.modules.notifications.** { *; }

# Expo SQLite
-keep class expo.modules.sqlite.** { *; }

# Expo SecureStore
-keep class expo.modules.securestore.** { *; }

# Expo FileSystem
-keep class expo.modules.filesystem.** { *; }

# Expo Image
-keep class expo.modules.image.** { *; }

# Expo Crypto
-keep class expo.modules.crypto.** { *; }

# Expo Network
-keep class expo.modules.network.** { *; }

# Expo Auth Session
-keep class expo.modules.authsession.** { *; }

# Expo Apple Authentication
-keep class expo.modules.appleauthentication.** { *; }

# ============================================================================
# Supabase & PostgreSQL JDBC
# ============================================================================

-keep class io.supabase.** { *; }
-keep class io.github.jan.supabase.** { *; }

# OkHttp (used by Supabase)
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# ============================================================================
# React Navigation
# ============================================================================

-keep class com.swmansion.reanimated.layoutReanimation.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }

# ============================================================================
# Fresco (Image Loading)
# ============================================================================

-keep class com.facebook.fresco.** { *; }
-keep class com.facebook.imagepipeline.** { *; }
-keep class com.facebook.drawee.** { *; }

# ============================================================================
# WebView
# ============================================================================

-keep class com.reactnativecommunity.webview.** { *; }

# ============================================================================
# AsyncStorage
# ============================================================================

-keep class com.reactnativecommunity.asyncstorage.** { *; }

# ============================================================================
# NetInfo
# ============================================================================

-keep class com.reactnativecommunity.netinfo.** { *; }

# ============================================================================
# SVG
# ============================================================================

-keep class com.horcrux.svg.** { *; }

# ============================================================================
# Safe Area Context
# ============================================================================

-keep class com.th3rdwave.safeareacontext.** { *; }

# ============================================================================
# Linear Gradient
# ============================================================================

-keep class com.BV.LinearGradient.** { *; }

# ============================================================================
# Kotlin Serialization & Reflection
# ============================================================================

-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

-keep,includedescriptorclasses class com.edufelip.finn.**$$serializer { *; }
-keepclassmembers class com.edufelip.finn.** {
    *** Companion;
}
-keepclasseswithmembers class com.edufelip.finn.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# ============================================================================
# General Android
# ============================================================================

# Keep Parcelables
-keep class * implements android.os.Parcelable {
  public static final android.os.Parcelable$Creator *;
}

# Keep Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ============================================================================
# Debugging
# ============================================================================

# Keep line numbers and source file names for better crash reports
-keepattributes SourceFile,LineNumberTable

# Rename source file attribute to hide exact file names
-renamesourcefileattribute SourceFile

# ============================================================================
# Suppress Warnings
# ============================================================================

-dontwarn com.facebook.react.**
-dontwarn com.google.android.gms.**
-dontwarn java.lang.management.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# ============================================================================
# Firebase Crashlytics
# ============================================================================

# Keep crash reporting classes
-keep class com.google.firebase.crashlytics.** { *; }
-keep class com.google.firebase.installations.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.tasks.** { *; }

# Keep exception stack traces
-keep public class * extends java.lang.Exception
-keepattributes Exceptions, Signature, InnerClasses

# Don't warn about Firebase dependencies
-dontwarn com.google.firebase.crashlytics.**
-dontwarn com.google.firebase.installations.**

# Keep BuildConfig for version info
-keep class **.BuildConfig { *; }

# Note: SourceFile,LineNumberTable already kept in "Debugging" section above
