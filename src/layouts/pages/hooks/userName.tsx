import { UserAppDto } from 'api/generated';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  username: string;
  userNameAndSurname: String;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setuserNameAndSurname: React.Dispatch<React.SetStateAction<string>>;

  loginUser: string;
  loginUserNameSurname: string;
  setLoginUser: React.Dispatch<React.SetStateAction<string>>;
  setloginUserNameSurname: React.Dispatch<React.SetStateAction<string>>;

  didProxy: boolean;
  setdidProxy: React.Dispatch<React.SetStateAction<boolean>>;

  sideNavCollapsed: boolean;
  setSideNavCollapsed: React.Dispatch<React.SetStateAction<boolean>>;

  userAppDto: UserAppDto,
  setuserUserAppDto: React.Dispatch<React.SetStateAction<UserAppDto>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [username, setUsername] = useState<string>('');
  const [userNameAndSurname, setuserNameAndSurname] = useState<string>('');
  const [userAppDto, setuserUserAppDto] = useState<UserAppDto>({} as UserAppDto);




  const [loginUser, setLoginUser] = useState<string>('');
  const [loginUserNameSurname, setloginUserNameSurname] = useState<string>('');

  const [didProxy, setdidProxy] = useState(false);

  const [sideNavCollapsed, setSideNavCollapsed] = useState(false);

  return (
    <UserContext.Provider value={{
      username, userNameAndSurname, userAppDto, setUsername, setuserNameAndSurname, setuserUserAppDto, loginUser, loginUserNameSurname,
      setLoginUser, setloginUserNameSurname, didProxy, setdidProxy, sideNavCollapsed, setSideNavCollapsed
    }}>
      {children}
    </UserContext.Provider>
  );
};
