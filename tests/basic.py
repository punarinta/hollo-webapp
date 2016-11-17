# https://christopher.su/2015/selenium-chromedriver-ubuntu/

import re
import config
from time import sleep
from selenium import webdriver

def log (text, status):
	if status == True:
		print '\033[92m[PASSED]\033[0m ' + text
	else:
		print '\033[91m[FAILED]\033[0m ' + text

def waitForElement (browser, selector, finalMsg = ''):
    time = 0.0
    maxTime = 5.0
    while time < maxTime:
        try:
            browser.find_element_by_css_selector(selector)
        except:
            time += 0.1
            sleep(0.1)
        else:
            log(finalMsg, 1)
            return True

    log(finalMsg, 0)
    return False

# remember to input your own file path to your chrome driver here if you're using chrome
browser = webdriver.Chrome()
browser.set_window_size(414, 736)	    # 375 x 667
browser.set_window_position(610, 0)     # 1024 - W x 0

rootURL = config.rootURL
print "\nLoading URL {}\n" . format(rootURL)
browser.get(rootURL)
waitForElement(browser, 'login-page', 'Loading login page')
log('Path init to /auth/login', browser.current_url == rootURL + '/auth/login')

i_username = browser.find_element_by_css_selector("input[type='email']")
i_password = browser.find_element_by_css_selector("input[type='password']")
i_username.send_keys(config.username)
i_password.send_keys(config.password)

b_login = browser.find_element_by_css_selector('button.login')
b_login.click()
waitForElement(browser, 'chats-page', 'Loading chats page')
log('Path changed to /chats', browser.current_url == rootURL + '/chats')

b_profile = browser.find_element_by_css_selector('chats-page bottom-bar bar-icon:nth-child(1)')
b_profile.click()
waitForElement(browser, 'profile-page', 'Loading profile page')
log('Path changed to /profile', browser.current_url == rootURL + '/profile')

print "\nTesting completed\n"
browser.quit()
