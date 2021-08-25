import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';

import FavScreen from '../screens/FavScreen';
import SearchScreen from '../screens/SearchScreen';
import UpdateScreen from '../screens/UpdateScreen';

import { BottomTabParamList, } from '../types';

const BottomTab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  return (
    <BottomTab.Navigator
      initialRouteName="Fav"
      tabBarOptions={{ activeTintColor: 'black'}}>
      <BottomTab.Screen
        name="Fav"
        component={FavScreen}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
          title: 'Books',
        }}
      />
      <BottomTab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
        }}
      />
      <BottomTab.Screen
        name="Update"
        component={UpdateScreen}
        options={{
          title:"Settings",
          tabBarIcon: ({ color }) => <TabBarIcon name="settings" color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
}

function TabBarIcon(props: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) {
  return <Ionicons size={30} style={{ marginBottom: -3 }} {...props} />;
}