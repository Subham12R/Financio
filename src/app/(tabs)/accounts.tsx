import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '../../components';
import { useOnboarding } from '../../hooks/useOnboarding';
import { getSetting, getUserByEmail, getUserByPassword, setSetting, updateUserPassword } from '../../lib/database';
import type { User } from '../../types';

export default function AccountsScreen() {
  const { getCurrentUserEmail, signOut } = useOnboarding();
  const [user, setUser] = useState<User | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const email = await getCurrentUserEmail();
      if (!email) return;
      const [userData, savedPhoto] = await Promise.all([
        getUserByEmail(email),
        getSetting(`profile_photo_${email}`),
      ]);
      setUser(userData as User);
      setPhotoUri(savedPhoto);
    };
    loadUser();
  }, []);

  const handleResetPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalVisible(true);
  };

  const handleSavePassword = async () => {
    const email = await getCurrentUserEmail();
    if (!email) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Required', 'Please fill all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirm password do not match.');
      return;
    }
    const isCurrentValid = await getUserByPassword(email, currentPassword);
    if (!isCurrentValid) {
      Alert.alert('Incorrect Password', 'Current password is incorrect.');
      return;
    }

    setUpdatingPassword(true);
    await updateUserPassword(email, newPassword);
    setUpdatingPassword(false);
    setPasswordModalVisible(false);
    Alert.alert('Success', 'Password updated successfully.');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handlePickPhoto = async () => {
    const email = await getCurrentUserEmail();
    if (!email) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow gallery permission to upload profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;
    const uri = result.assets[0].uri;
    await setSetting(`profile_photo_${email}`, uri);
    setPhotoUri(uri);
  };

  return (
    <View className="flex-1 bg-[#faf5f0]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-12 pb-36 mt-10"
      >
        <Text variant="h1" className="text-black">Accounts Page</Text>
        <Text variant="body" className="mt-1 text-black/65">
          User image, details and security settings
        </Text>

        <View className="mt-6 items-center rounded-3xl border border-black/10 bg-white p-6">
          <TouchableOpacity
            className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#EAF2FF]"
            onPress={handlePickPhoto}
            activeOpacity={0.85}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: 96, height: 96 }} resizeMode="cover" />
            ) : (
              <Ionicons name="person" size={44} color="#2E7CFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
            <Text variant="caption" className="mt-2 text-[#2E7CFF] text-[13px]">
              Choose from gallery
            </Text>
          </TouchableOpacity>
          <Text variant="h2" className="mt-4 text-black">{user?.username || 'User'}</Text>
          <Text variant="body" className="mt-1 text-black/60">{user?.email || 'No email found'}</Text>
        </View>

        <View className="mt-6 rounded-3xl border border-black/10 bg-white p-5">
          <Text variant="h3" className="text-black">User Details</Text>
          <View className="mt-4 rounded-2xl bg-[#F5F5F5] p-4">
            <Text variant="caption" className="text-black/45">Account Type</Text>
            <Text variant="body" className="mt-1 text-black">Personal</Text>
          </View>
          <View className="mt-3 rounded-2xl bg-[#F5F5F5] p-4">
            <Text variant="caption" className="text-black/45">Joined</Text>
            <Text variant="body" className="mt-1 text-black">September 2026</Text>
          </View>
        </View>

        <View className="mt-6 rounded-3xl border border-black/10 bg-white p-5">
          <Text variant="h3" className="text-black">Security</Text>
          <TouchableOpacity
            className="mt-4 flex-row items-center justify-between rounded-2xl border border-black/10 bg-[#F7FAFF] p-4"
            onPress={handleResetPassword}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="key" size={18} color="#2E7CFF" />
              <Text variant="body" className="text-black">User Password Reset</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8A8D94" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="mt-6 h-14 items-center justify-center rounded-2xl border border-[#DC2626]/35 bg-[#DC2626]"
          onPress={handleSignOut}
          activeOpacity={0.9}
        >
          <Text variant="body" className="text-white font-semibold text-[17px]">
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal transparent animationType="fade" visible={passwordModalVisible} onRequestClose={() => setPasswordModalVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/35 px-6">
          <View className="w-full rounded-3xl bg-white p-5">
            <Text variant="h3" className="mb-4 text-black text-[20px]">Reset Password</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Current password"
              placeholderTextColor="rgba(0,0,0,0.35)"
              className="mb-3 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black"
            />
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="New password"
              placeholderTextColor="rgba(0,0,0,0.35)"
              className="mb-3 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black"
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Confirm new password"
              placeholderTextColor="rgba(0,0,0,0.35)"
              className="mb-4 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black"
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 items-center rounded-xl bg-[#E9E9E9] py-3"
                onPress={() => setPasswordModalVisible(false)}
                disabled={updatingPassword}
              >
                <Text variant="body" className="text-black text-[15px]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 items-center rounded-xl py-3 ${updatingPassword ? 'bg-[#2E7CFF]/60' : 'bg-[#2E7CFF]'}`}
                onPress={handleSavePassword}
                disabled={updatingPassword}
              >
                <Text variant="body" className="text-white text-[15px] font-semibold">
                  {updatingPassword ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
