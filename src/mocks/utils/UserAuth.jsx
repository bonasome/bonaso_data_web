import { UserContext } from '../../contexts/UserAuth';

export const MockUserAuthProvider = ({ children, mockUser }) => {
  return (
        <UserContext.Provider
            value={{
                user: mockUser,
                loggedIn: true,
                loading: false,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};