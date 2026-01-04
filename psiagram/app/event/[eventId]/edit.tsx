import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function EditEvent() {
  // 1. Grab the ID from the folder name
  const { id } = useLocalSearchParams();
  
  // 2. Setup state for your form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 3. Load existing data when page opens
  useEffect(() => {
    // In a real app, fetch from your API here: fetch(`api/events/${id}`)
    console.log(`Fetching data for event ${id}...`);
    
    // Simulating a network request delay
    setTimeout(() => {
      setTitle('My Awesome Event'); // Mock data
      setDescription('This is the current description.'); 
      setIsLoading(false);
    }, 500);
  }, [id]);

  // 4. Handle the Save Button
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Title is required!");
      return;
    }

    // HERE: Add your API call to update the database (PUT/PATCH)
    console.log('Saving changes:', { id, title, description });

    Alert.alert("Success", "Event updated!", [
      { 
        text: "OK", 
        onPress: () => router.back() // Go back to the view page
      }
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Event {id}</Text>

      {/* Title Input */}
      <View style={styles.group}>
        <Text style={styles.label}>Event Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter event name"
        />
      </View>

      {/* Description Input */}
      <View style={styles.group}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter details"
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.row}>
        <Button title="Cancel" color="red" onPress={() => router.back()} />
        <View style={{ width: 20 }} /> {/* Spacer */}
        <Button title="Save Changes" onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  group: { 
    marginBottom: 15 
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 5 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    backgroundColor: '#f9f9f9' 
  },
  textArea: { 
    height: 100, 
    textAlignVertical: 'top' // Keeps text at top on Android
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 10 
  }
});