/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useState, useRef, useEffect } from "react";
// import clsx from 'clsx';
import copy from "copy-text-to-clipboard";
import { Clipboard, CheckLg } from "react-bootstrap-icons";
// import IconCopy from '@theme/Icon/Copy';
// import IconSuccess from '@theme/Icon/Success';

// import styles from './styles.module.css';

export default function CopyButton(props: any): JSX.Element {
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeout = useRef<number | undefined>(undefined);

  const buttonRef = React.useRef(null);

  const handleClick = () => {
    // @ts-ignore
    const parentElement = buttonRef.current?.parentNode;
    const nextChild = parentElement.childNodes[1];
    const innerText = nextChild.innerText;
    // console.log(innerText);

    copy(innerText);
    setIsCopied(true);
    copyTimeout.current = window.setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };

  useEffect(() => () => window.clearTimeout(copyTimeout.current), []);

  return (
    <button
      type="button"
      aria-label={isCopied ? "Copied" : "Copy code to clipboard"}
      title={"Copy"}
      className={
        "right-6 top-6 absolute select-none outline outline-1 outline-gray-700 dark:outline-gray-300 text-gray-500 hover:text-gray-400 p-3 rounded-lg"
      }
      //   onClick={handleCopyCode}
      ref={buttonRef}
      onClick={handleClick}
    >
      <span className={""} aria-hidden="true">
        {!isCopied ? (
          <Clipboard className="w-6 h-6"/>
        ) : (
          <CheckLg className="w-6 h-6 text-[#00d600]" />
        )}
      </span>
    </button>
  );
}
